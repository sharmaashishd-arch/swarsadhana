#!/usr/bin/env python3
"""
Validate tabla sample manifest.

Fails (exit 1) if:
  - Any sample has attribution_required == true
  - Any sample has an unknown/disallowed license
  - Any referenced WAV file is missing on disk
  - Required manifest fields are missing
  - Expected bols or variants are absent

Allowed licenses:
  - CC0, generated-no-license-needed, pixabay-content-license, samplefocus-royalty-free
"""

import json
import os
import sys

MANIFEST_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets", "audio", "tabla", "manifest.json",
)

ASSETS_BASE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets", "audio", "tabla",
)

ALLOWED_LICENSES = {
    "CC0",
    "cc0",
    "generated-no-license-needed",
    "pixabay-content-license",
    "samplefocus-royalty-free",
}

REQUIRED_BOLS = {"dha", "dhin", "tin", "na", "ta", "ge", "ke"}
REQUIRED_VARIANTS = {"v1", "v2"}
REQUIRED_FIELDS = {"filename", "bol", "variant", "source_url", "license", "attribution_required"}


def main():
    errors = []

    if not os.path.exists(MANIFEST_PATH):
        print(f"FAIL: manifest not found at {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    samples = manifest.get("samples", [])
    if not samples:
        print("FAIL: manifest contains no samples")
        sys.exit(1)

    seen_bols: dict[str, set[str]] = {}

    for i, entry in enumerate(samples):
        prefix = f"samples[{i}] ({entry.get('filename', '?')})"

        missing = REQUIRED_FIELDS - set(entry.keys())
        if missing:
            errors.append(f"{prefix}: missing fields {missing}")
            continue

        if entry["attribution_required"] is True:
            errors.append(f"{prefix}: attribution_required is true — NOT ALLOWED")

        if entry["license"] not in ALLOWED_LICENSES:
            errors.append(f"{prefix}: unknown license '{entry['license']}' — not in allowed list")

        wav_path = os.path.join(ASSETS_BASE, entry["filename"])
        if not os.path.isfile(wav_path):
            errors.append(f"{prefix}: WAV file not found at {wav_path}")

        bol = entry["bol"]
        variant = entry["variant"]
        seen_bols.setdefault(bol, set()).add(variant)

    for bol in REQUIRED_BOLS:
        if bol not in seen_bols:
            errors.append(f"Missing bol '{bol}' entirely")
        else:
            missing_v = REQUIRED_VARIANTS - seen_bols[bol]
            if missing_v:
                errors.append(f"Bol '{bol}' missing variants: {missing_v}")

    if errors:
        print(f"FAIL: {len(errors)} validation error(s):")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)
    else:
        print(f"OK: {len(samples)} samples validated — all licenses clean, all files present")
        sys.exit(0)


if __name__ == "__main__":
    main()
