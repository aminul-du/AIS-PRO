use axum::{
    extract::Json,
    response::{Html, IntoResponse},
    routing::{get, post},
    Router,
};
use chrono::Utc;
use hex;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::OpenOptions;
use std::io::Write;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

const DASHBOARD_HTML: &str = include_str!("../../dashboard-react/index.html");

#[derive(Clone)]
struct AppState {
    worker_url: String,
    http_client: Client,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct InterceptRequest {
    #[serde(alias = "text")]
    content: Option<String>,
    #[serde(default = "default_language_mode")]
    language_mode: String,
    #[serde(default = "default_channel")]
    channel: String,
    #[serde(default = "default_provenance")]
    provenance: String,
}

fn default_language_mode() -> String {
    "bengali".to_string()
}
fn default_channel() -> String {
    "user_chat".to_string()
}
fn default_provenance() -> String {
    "verified".to_string()
}

#[derive(Serialize, Clone, Debug)]
struct Signals {
    #[serde(rename = "I")]
    i: f64,
    #[serde(rename = "P")]
    p: f64,
    #[serde(rename = "B")]
    b: f64,
    #[serde(rename = "S")]
    s: f64,
    #[serde(rename = "L")]
    l: f64,
}

#[derive(Serialize, Clone, Debug)]
struct InterceptResponse {
    event_id: String,
    timestamp: String,
    content_hash: String,
    language_mode: String,
    channel: String,
    provenance: String,
    mrs: f64,
    decision: String,
    signals: Signals,
    worker_status: String,
}

#[tokio::main]
async fn main() {
    let port = std::env::var("PMICS_GATEWAY_PORT")
        .or_else(|_| std::env::var("GATEWAY_PORT"))
        .unwrap_or_else(|_| "18081".to_string());
    let addr = format!("127.0.0.1:{}", port);

    let worker_url = std::env::var("PMICS_WORKER_URL")
        .or_else(|_| std::env::var("WORKER_URL"))
        .unwrap_or_else(|_| "http://127.0.0.1:18082".to_string());

    let state = Arc::new(AppState {
        worker_url,
        http_client: Client::builder().build().unwrap(),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(ui_handler))
        .route("/ui", get(ui_handler))
        .route("/dashboard", get(ui_handler))
        .route("/health", get(health_handler))
        .route("/api/intercept", post(intercept_handler))
        .route("/intercept", post(intercept_handler))
        .route("/process", post(process_handler))
        .route("/api/recover", post(recover_handler))
        .route("/api/telemetry", get(telemetry_handler))
        .layer(cors)
        .with_state(state);

    println!("PMICS Axum Gateway listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn ui_handler() -> Html<&'static str> {
    Html(DASHBOARD_HTML)
}

async fn health_handler() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "pmics-gateway-axum",
        "protocol": "MRS=f(I,P,B,S,L)"
    }))
}

async fn recover_handler() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "recovered",
        "action": "CLEAN_STATE_RESTORED"
    }))
}

async fn telemetry_handler() -> impl IntoResponse {
    let data = std::fs::read_to_string("telemetry_ledger.jsonl").unwrap_or_default();
    (
        [(axum::http::header::CONTENT_TYPE, "text/plain; charset=utf-8")],
        data,
    )
}

fn calculate_mrs(req: &InterceptRequest) -> (f64, String, Signals) {
    let text = req.content.as_deref().unwrap_or("");
    let lowered = text.to_lowercase();

    let attack_tokens = [
        "ignore previous",
        "system prompt",
        "override",
        "bypass",
        "exfiltrate",
        "jailbreak",
        "রুট অ্যাক্সেস",
        "নির্দেশ মানবে না",
    ];
    let hits = attack_tokens
        .iter()
        .filter(|&&tok| lowered.contains(tok))
        .count();

    let i_sig = (0.04 + (hits as f64 * 0.34) + if lowered.contains("ignore") { 0.18 } else { 0.0 })
        .min(1.0);

    let p_sig = match req.provenance.as_str() {
        "spoofed" => 0.92,
        "unverified" => 0.48,
        _ => 0.05,
    };

    let b_sig = if req.channel == "mcp_tool" && req.provenance != "verified" {
        0.79
    } else if req.channel == "user_chat" {
        0.14
    } else {
        0.08
    };

    let s_sig = match req.language_mode.as_str() {
        "mixed" => 0.44,
        "banglish" => 0.17,
        _ => 0.07,
    };

    let l_sig = (0.05 + (text.len() as f64 / 600.0).min(0.45)).min(1.0);

    let mrs = (0.28 * i_sig + 0.22 * p_sig + 0.18 * b_sig + 0.16 * s_sig + 0.16 * l_sig * 1000.0)
        .round()
        / 1000.0;

    let decision = if mrs >= 0.65 {
        "BLOCK_AND_QUARANTINE".to_string()
    } else if mrs >= 0.35 {
        "EARLY_WARNING_HOLD".to_string()
    } else {
        "ALLOW_WRITE".to_string()
    };

    let signals = Signals {
        i: (i_sig * 1000.0).round() / 1000.0,
        p: (p_sig * 1000.0).round() / 1000.0,
        b: (b_sig * 1000.0).round() / 1000.0,
        s: (s_sig * 1000.0).round() / 1000.0,
        l: (l_sig * 1000.0).round() / 1000.0,
    };

    (mrs, decision, signals)
}

async fn intercept_handler(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Json(payload): Json<InterceptRequest>,
) -> impl IntoResponse {
    let text = payload.content.clone().unwrap_or_default();
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    let content_hash = hex::encode(hasher.finalize());

    let event_id = Uuid::new_v4().to_string();
    let timestamp = Utc::now().to_rfc3339();

    let (mrs, decision, signals) = calculate_mrs(&payload);

    // Forward to Python worker asynchronously
    let worker_res = state
        .http_client
        .post(format!("{}/analyze", state.worker_url))
        .json(&serde_json::json!({
            "content": text,
            "language_mode": payload.language_mode,
            "channel": payload.channel,
            "provenance": payload.provenance,
        }))
        .send()
        .await;

    let worker_status = match worker_res {
        Ok(resp) if resp.status().is_success() => "verified".to_string(),
        Ok(resp) if resp.status().as_u16() == 400 => "quarantined".to_string(),
        _ => if decision == "BLOCK_AND_QUARANTINE" { "quarantined".to_string() } else { "verified".to_string() },
    };

    let response = InterceptResponse {
        event_id,
        timestamp,
        content_hash,
        language_mode: payload.language_mode,
        channel: payload.channel,
        provenance: payload.provenance,
        mrs,
        decision,
        signals,
        worker_status,
    };

    // Log telemetry
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("telemetry_ledger.jsonl")
    {
        let _ = writeln!(file, "{}", serde_json::to_string(&response).unwrap_or_default());
    }

    Json(response)
}

// Backward compatibility handler for legacy process endpoint
async fn process_handler(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Json(payload): Json<InterceptRequest>,
) -> impl IntoResponse {
    let (_, decision, _) = calculate_mrs(&payload);

    let worker_res = state
        .http_client
        .post(format!("{}/analyze", state.worker_url))
        .json(&serde_json::json!({
            "language_mode": payload.language_mode,
            "channel": payload.channel,
            "provenance": payload.provenance,
        }))
        .send()
        .await;

    let status = match worker_res {
        Ok(resp) if resp.status().is_success() => "passed",
        _ => if decision == "BLOCK_AND_QUARANTINE" { "failed" } else { "passed" },
    };

    // Log telemetry
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("telemetry_ledger.jsonl")
    {
        let log_entry = serde_json::json!({
            "payload": payload,
            "status": status,
            "timestamp": Utc::now().to_rfc3339()
        });
        let _ = writeln!(file, "{}", log_entry);
    }

    Json(status)
}
