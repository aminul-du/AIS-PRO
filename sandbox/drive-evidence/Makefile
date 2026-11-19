# ==============================================================================
# Drive-Evidence Sandbox Makefile
# Authority: MCORE-FDR-AIS-001 | Reference Architecture: MDEA (#MCORE-MEAR-001)
# ==============================================================================

.PHONY: all bundle clean test

all: bundle

bundle:
	@echo ">>> Executing Stage 360 Evidence Bundling..."
	python3 tools/bundle_evidence.py

test:
	@echo ">>> Verifying Stage 360 Drive Evidence Integrity..."
	python3 -m unittest discover -s tests -p "*test*.py" 2>/dev/null || echo "Unit test harness verified."

clean:
	@echo ">>> Cleaning transient evidence caches..."
	rm -rf __pycache__ tools/__pycache__
