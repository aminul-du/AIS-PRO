#!/usr/bin/env python3
"""
Frontmatter & Architectural Metadata Linter for AIS-PRO
Authority: Md. Aminul Islam ("Shamim") | MCORE-FDR-AIS-001
Reference Architecture: MDEA (#MCORE-MEAR-001)

Validates that Markdown files in specs/, research/, and governance roots
possess mandatory YAML frontmatter with locked identity and quantization profile.
"""

import sys
import os
import re
from pathlib import Path

REQUIRED_FIELDS = ["id", "title", "author_id", "quantization_profile"]
EXPECTED_AUTHOR = "MCORE-FDR-AIS-001"
VALID_PROFILES = ["L0-Lossless", "L1-Semantic-Lossless", "L2-Bounded-Lossy"]


def lint_markdown_file(file_path: Path) -> list:
    errors = []
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        return [f"Failed to read file: {e}"]

    if not content.startswith("---"):
        return ["Missing frontmatter delimiter ('---' at line 1)"]

    parts = content.split("---", 2)
    if len(parts) < 3:
        return ["Malformed frontmatter: closing delimiter ('---') not found"]

    frontmatter_text = parts[1]
    metadata = {}
    for line in frontmatter_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            metadata[key.strip()] = val.strip()

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in metadata or not metadata[field]:
            errors.append(f"Missing mandatory field '{field}' in frontmatter")

    # Validate author
    author = metadata.get("author_id", "")
    if author and author != EXPECTED_AUTHOR:
        errors.append(f"Invalid author_id '{author}'. Expected locked authority '{EXPECTED_AUTHOR}'")

    # Validate quantization profile
    profile = metadata.get("quantization_profile", "")
    if profile and profile not in VALID_PROFILES:
        errors.append(f"Invalid quantization_profile '{profile}'. Must be one of {VALID_PROFILES}")

    return errors


def main():
    target_files = []
    if len(sys.argv) > 1:
        # Files passed as arguments (e.g., from pre-commit)
        for arg in sys.argv[1:]:
            p = Path(arg).resolve()
            if p.suffix == ".md" and p.is_file():
                # Focus on specs/, research/, and root governance files
                rel = str(p)
                if any(k in rel for k in ["/specs/", "/research/", "/architecture/", "/startup/", "/labs/", "IDENTITY.md", "README.md"]):
                    target_files.append(p)
    else:
        # Default scan
        root = Path(__file__).resolve().parent.parent
        for folder in ["specs", "research", "architecture", "startup", "labs"]:
            target_files.extend((root / folder).glob("**/*.md"))
        for root_md in ["IDENTITY.md", "README.md"]:
            p = root / root_md
            if p.exists():
                target_files.append(p)

    if not target_files:
        sys.exit(0)

    total_failed = 0
    print(f"[frontmatter-linter] Checking {len(target_files)} Markdown document(s)...")

    for fpath in sorted(target_files):
        errors = lint_markdown_file(fpath)
        if errors:
            total_failed += 1
            print(f"  ❌ FAILED: {fpath}")
            for err in errors:
                print(f"     - {err}")
        else:
            print(f"  ✅ PASSED: {fpath.name}")

    if total_failed > 0:
        print(f"\n[frontmatter-linter] Check FAILED: {total_failed} file(s) contain invalid metadata.")
        sys.exit(1)

    print("[frontmatter-linter] All checked files adhere strictly to MDEA governance metadata.")
    sys.exit(0)


if __name__ == "__main__":
    main()
