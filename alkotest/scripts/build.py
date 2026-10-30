#!/usr/bin/env python3
"""Embed data/questions.json into index.html.

index.html is a single self-contained file: the dataset lives inline in the
<script id="alkoflash-data"> block so the app works offline and directly from
the filesystem. data/questions.json stays the source of truth; run this script
after every dataset change.

    python3 scripts/build.py
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "questions.json"
HTML = ROOT / "index.html"

BLOCK = re.compile(
    r'(<script type="application/json" id="alkoflash-data">)(.*?)(</script>)',
    re.DOTALL,
)


def main() -> int:
    if not DATA.exists():
        print(f"missing dataset: {DATA}", file=sys.stderr)
        return 1
    if not HTML.exists():
        print(f"missing page: {HTML}", file=sys.stderr)
        return 1

    data = json.loads(DATA.read_text(encoding="utf-8"))
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    html = HTML.read_text(encoding="utf-8")
    if not BLOCK.search(html):
        print('index.html: data block <script id="alkoflash-data"> not found', file=sys.stderr)
        return 1

    html, count = BLOCK.subn(lambda m: m.group(1) + payload + m.group(3), html, count=1)
    if count != 1:
        print(f"index.html: expected 1 data block, replaced {count}", file=sys.stderr)
        return 1

    HTML.write_text(html, encoding="utf-8")

    questions = data["questions"]
    print(f"OK: embedded {len(questions)} questions into index.html ({len(payload):,} bytes)")
    for category in data["categories"]:
        n = sum(1 for q in questions if q["category"] == category["id"])
        print(f"  {category['id']}: {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
