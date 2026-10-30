#!/usr/bin/env python3
"""Validate data/questions.json before committing changes."""

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "questions.json"
PREFIX = {"alkoholpolitik": "alp", "servering": "ser", "tillsyn": "til"}
REQUIRED = ("id", "category", "topic", "question", "answer", "options", "correct", "explanation", "law")


def main() -> int:
    with DATA.open(encoding="utf-8") as fh:
        data = json.load(fh)

    questions = data["questions"]
    categories = {c["id"] for c in data["categories"]}
    errors: list[str] = []

    if len(questions) < 100:
        errors.append(f"expected at least 100 questions, found {len(questions)}")

    ids = [q.get("id") for q in questions]
    for dup, count in Counter(ids).items():
        if count > 1:
            errors.append(f"duplicate id: {dup}")

    for q in questions:
        qid = q.get("id", "<missing id>")
        for field in REQUIRED:
            if field not in q or q[field] in ("", None, []):
                errors.append(f"{qid}: missing or empty field {field}")

        category = q.get("category")
        if category not in categories:
            errors.append(f"{qid}: unknown category {category!r}")
        elif not str(qid).startswith(PREFIX[category] + "-"):
            errors.append(f"{qid}: id should start with {PREFIX[category]}-")

        options = q.get("options", [])
        if len(options) != 4:
            errors.append(f"{qid}: expected 4 options, found {len(options)}")
        correct = q.get("correct")
        if not isinstance(correct, int) or not 0 <= correct < len(options):
            errors.append(f"{qid}: invalid correct index {correct!r}")
        elif options[correct] != q.get("answer"):
            errors.append(f"{qid}: answer does not match options[correct]")

    for question, count in Counter(q.get("question") for q in questions).items():
        if count > 1:
            errors.append(f"duplicate question text: {question!r}")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print(f"OK: {len(questions)} questions")
    for category, count in sorted(Counter(q["category"] for q in questions).items()):
        print(f"  {category}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
