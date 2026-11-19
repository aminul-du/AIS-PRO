"""
Colab/Jupyter Notebook Client Snippet for mte-lab / PMICS Security Assessment.
Connects to https://api-gdocs.shorborno.ai/api/v1/query, prints Vector ID retrieval hits,
and archives the 10-file evidence bundle.
"""
from .mte_query_client import run_mte_query, run_ragsec_query, API_ENDPOINT

if __name__ == "__main__":
    sample_query = "Evaluate memory poisoning and sleeper payload risks in agentic Vector ID memory workflows."
    run_mte_query(sample_query, endpoint="http://localhost:8000/api/v1/query")
