use warp::Filter;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::env;
use std::fs::OpenOptions;
use std::io::Write;

#[derive(Deserialize, Serialize, Clone)]
struct Payload {
    language_mode: String,
    channel: String,
    provenance: String,
}

#[tokio::main]
async fn main() {
    let port: u16 = env::var("GATEWAY_PORT").unwrap_or_else(|_| "18081".to_string()).parse().unwrap();
    let worker_url = env::var("WORKER_URL").unwrap_or_else(|_| "http://127.0.0.1:18082".to_string());

    let process = warp::post()
        .and(warp::path("process"))
        .and(warp::body::json())
        .and(warp::any().map(move || worker_url.clone()))
        .and_then(handle_process);

    let recover = warp::post()
        .and(warp::path("api"))
        .and(warp::path("recover"))
        .map(|| warp::reply::json(&"recovered"));

    let health = warp::get().and(warp::path("health")).map(|| warp::reply::json(&"ok"));

    let routes = process.or(recover).or(health);

    println!("Gateway listening on 127.0.0.1:{}", port);
    warp::serve(routes).run(([127, 0, 0, 1], port)).await;
}

async fn handle_process(payload: Payload, worker_url: String) -> Result<impl warp::Reply, warp::Rejection> {
    let client = Client::new();
    let res = client.post(format!("{}/analyze", worker_url))
        .json(&payload)
        .send()
        .await;

    let status = match res {
        Ok(resp) if resp.status().is_success() => "passed",
        _ => "failed",
    };

    // Log telemetry
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("telemetry_ledger.jsonl")
        .unwrap();

    let log_entry = serde_json::json!({
        "payload": payload,
        "status": status,
        "timestamp": chrono::Utc::now().to_rfc3339()
    });
    writeln!(file, "{}", log_entry.to_string()).unwrap();

    Ok(warp::reply::json(&status))
}
