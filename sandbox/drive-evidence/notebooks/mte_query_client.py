"""
Colab/Jupyter Notebook Client Snippet for Gemini Enterprise Agent Platform / MTE Assessment.
Connects to https://api-gdocs.shorborno.ai/api/v1/query, prints Vector ID retrieval hits,
and archives the 10-file evidence bundle.
"""
import json
from pathlib import Path
import requests

API_ENDPOINT = "https://api-gdocs.shorborno.ai/api/v1/query"

def run_mte_query(
    prompt: str,
    top_k: int = 3,
    session_id: str = "notebook-eval-01",
    user_id: str = "research-evaluator",
    memory_profile: str = "academic-pmics-defense",
    revision_id: str = "rev-2026-v1",
    output_bundle_path: str = "mte_evidence_bundle.json",
    endpoint: str = API_ENDPOINT
) -> dict:
    """
    Submits a query to the mte-lab API and extracts evidence artifacts with Vector IDs,
    Memory Profiles, and Revision Audits.
    """
    payload = {
        "query": prompt,
        "top_k": top_k,
        "session_id": session_id,
        "user_id": user_id,
        "memory_profile": memory_profile,
        "revision_id": revision_id
    }

    print(f"🚀 Sending query to {endpoint}...")
    print(f"   Identity Scope: user_id={user_id} | profile={memory_profile} | revision={revision_id}")
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ API Request failed: {e}")
        return {}

    # Print Summary & Answer
    print("\n" + "=" * 60)
    print("🤖 MODEL GENERATED RESPONSE (Agent Runtime / Vertex AI):")
    print("=" * 60)
    print(data.get("answer", "").strip())

    # Print Retrieved Chunks & Vector IDs
    print("\n" + "=" * 60)
    print(f"📚 MEMORY BANK VECTOR NODES ({len(data.get('retrieval_hits', []))} hits):")
    print("=" * 60)
    for idx, chunk in enumerate(data.get("retrieval_hits", [])):
        vec_id = chunk.get("vector_id", chunk.get("chunk_id"))
        trust = chunk.get("trust_class", "CONFIRMED")
        rev = chunk.get("revision_id", revision_id)
        print(f"[{idx+1}] Vector ID : {vec_id} | Revision: {rev} | Trust: {trust}")
        print(f"    Source    : {chunk.get('source')} (Score: {chunk.get('relevance_score')})")
        print(f"    Hash      : {chunk.get('integrity_hash')}")
        print(f"    Content   : {chunk.get('content')}\n")

    # Save Evidence Bundle
    bundle = data.get("evidence_bundle", {})
    bundle_file = Path(output_bundle_path)
    bundle_file.write_text(json.dumps(bundle, indent=2))
    
    print("=" * 60)
    print(f"🛡️  10-FILE EVIDENCE BUNDLE SAVED:")
    print(f"    Path      : {bundle_file.resolve()}")
    print(f"    Files     : {len(bundle.get('files', []))} artifacts")
    print(f"    SHA256    : {bundle.get('sha256_digest')}")
    print("=" * 60)

    return data

# Backwards compatibility alias
run_ragsec_query = run_mte_query

if __name__ == "__main__":
    # Test execution
    sample_query = "Evaluate memory poisoning and sleeper payload risks in agentic Vector ID memory workflows."
    # Use localhost if testing locally
    run_mte_query(sample_query, endpoint="http://localhost:8000/api/v1/query")
