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

    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "OPTIONS"])
        .allow_headers(vec!["Content-Type", "Authorization"]);

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

    let telemetry = warp::get()
        .and(warp::path("api"))
        .and(warp::path("telemetry"))
        .map(|| {
            let data = std::fs::read_to_string("telemetry_ledger.jsonl").unwrap_or_else(|_| "".to_string());
            warp::reply::with_header(warp::reply::html(data), "content-type", "text/plain; charset=utf-8")
        });

    let ui = warp::get()
        .and(warp::path("ui"))
        .map(|| {
            let html = include_str!("../../dashboard-react/index.html");
            warp::reply::with_header(warp::reply::html(html), "content-type", "text/html; charset=utf-8")
        });

    let root = warp::get()
        .and(warp::path::end())
        .and(warp::header::optional::<String>("host"))
        .map(|host: Option<String>| {
            let host_str = host.unwrap_or_default().to_lowercase();
            if host_str.contains("labs") {
                let html = include_str!("../../dashboard-react/index.html");
                warp::reply::with_header(warp::reply::html(html), "content-type", "text/html; charset=utf-8")
            } else {
                warp::reply::with_header(
                    warp::reply::html("<!DOCTYPE html><html><head><title>PMICS Lab Gateway</title><style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;padding:2rem;line-height:1.6;}.card{background:#1e293b;padding:2rem;border-radius:8px;max-width:600px;margin:auto;box-shadow:0 4px 6px -1px rgba(0,0,0,0.2);}</style></head><body><div class='card'><h1 style='color:#38bdf8;margin-top:0;'>PMICS Lab Gateway Active</h1><p>Status: <span style='color:#22c55e;font-weight:bold;'>Online (Verified)</span></p><p>Access the UI dashboard at <a href='https://labs.mcoreai.tech' style='color:#38bdf8;'>labs.mcoreai.tech</a> or use <code>POST /process</code>.</p></div></body></html>"),
                    "content-type",
                    "text/html; charset=utf-8"
                )
            }
        });

    let routes = process
        .or(recover)
        .or(health)
        .or(telemetry)
        .or(ui)
        .or(root)
        .with(cors);

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
