from fastapi import FastAPI, HTTPException
import uvicorn
import os

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
def analyze(payload: dict):
    # Simulate Vertex AI verification logic
    mode = payload.get("language_mode")
    prov = payload.get("provenance")
    
    if mode == "mixed" and prov == "spoofed":
        raise HTTPException(status_code=400, detail="Adversarial detected")
    
    return {"status": "verified"}

if __name__ == "__main__":
    port = int(os.getenv("WORKER_PORT", 18082))
    uvicorn.run(app, host="127.0.0.1", port=port)
