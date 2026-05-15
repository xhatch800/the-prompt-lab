#!/usr/bin/env python3
"""
Validation script for just_draw_tagged.json
Based on design.md tag/item quality rules, adapted for just_draw prompts.
"""

import json
import sys
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

DATA_FILE = Path(__file__).parent.parent / "data" / "just_draw_tagged.json"

APPROVED_PRIMARY_TAGS = {
    "spatial", "sensory", "temporal", "emotional",
    "craft", "organic", "still_life", "urban",
    "imagination", "nature", "figures"
}

APPROVED_CONTEXT_TAGS = {"seasonal", "holiday"}

APPROVED_TAGS = APPROVED_PRIMARY_TAGS | APPROVED_CONTEXT_TAGS

# Per design.md: every primary tag must appear on ≥20 items.
# imagination is a known exception — warn, don't fail.
COVERAGE_THRESHOLD = 20
COVERAGE_WARN_ONLY = {"imagination"}

# ── Helpers ───────────────────────────────────────────────────────────────────

def load(path: Path):
    with open(path) as f:
        return json.load(f)

class Results:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []

    def error(self, msg): self.errors.append(f"  ✗ {msg}")
    def warn(self, msg):  self.warnings.append(f"  ⚠ {msg}")
    def info_(self, msg): self.info.append(f"  · {msg}")

    def print_all(self):
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)})")
            for e in self.errors: print(e)
        if self.warnings:
            print(f"\n⚠  WARNINGS ({len(self.warnings)})")
            for w in self.warnings: print(w)
        if self.info:
            print(f"\nℹ  INFO ({len(self.info)})")
            for i in self.info: print(i)

    @property
    def passed(self):
        return len(self.errors) == 0

# ── Checks ────────────────────────────────────────────────────────────────────

def check_schema(items, r):
    """Every item must be { name: str, tags: list }"""
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            r.error(f"[{i}] Item is not an object: {repr(item)[:80]}")
            continue
        if "name" not in item:
            r.error(f"[{i}] Missing 'name' field: {repr(item)[:80]}")
        elif not isinstance(item["name"], str) or not item["name"].strip():
            r.error(f"[{i}] 'name' must be a non-empty string")
        if "tags" not in item:
            r.error(f"[{i}] Missing 'tags' field: {repr(item.get('name','?'))[:80]}")
        elif not isinstance(item["tags"], list):
            r.error(f"[{i}] 'tags' must be an array: {repr(item.get('name','?'))[:80]}")


def check_no_duplicates(items, r):
    """No two items with the same name."""
    seen = {}
    for i, item in enumerate(items):
        name = item.get("name", "")
        if name in seen:
            r.error(f"Duplicate name at [{i}] and [{seen[name]}]: {repr(name)[:80]}")
        else:
            seen[name] = i


def check_tag_vocabulary(items, r):
    """All tags must be from the approved set."""
    unknown = set()
    for item in items:
        for tag in item.get("tags", []):
            if tag not in APPROVED_TAGS:
                unknown.add(tag)
    for tag in sorted(unknown):
        r.error(f"Unknown tag: '{tag}' — not in approved vocabulary")


def check_coverage(items, r):
    """Every primary tag must appear on ≥ COVERAGE_THRESHOLD items."""
    counts = {tag: 0 for tag in APPROVED_PRIMARY_TAGS}
    for item in items:
        for tag in item.get("tags", []):
            if tag in APPROVED_PRIMARY_TAGS:
                counts[tag] += 1

    print(f"\n📊 Primary tag coverage ({len(items)} prompts):")
    for tag in sorted(APPROVED_PRIMARY_TAGS):
        count = counts[tag]
        pct = 100 * count / len(items) if items else 0
        bar = "█" * (count // 5) + ("▌" if count % 5 >= 3 else "")
        status = "✓" if count >= COVERAGE_THRESHOLD else ("⚠" if tag in COVERAGE_WARN_ONLY else "✗")
        print(f"  {status} {tag:<12} {count:>4} items ({pct:.0f}%)  {bar}")

        if count < COVERAGE_THRESHOLD:
            msg = f"Tag '{tag}' has only {count} items (threshold: {COVERAGE_THRESHOLD})"
            if tag in COVERAGE_WARN_ONLY:
                r.warn(msg + " — known exception, new prompts needed")
            else:
                r.error(msg)


def check_no_primary_tags(items, r):
    """Items with zero primary tags — flag but don't fail."""
    untagged = []
    for item in items:
        tags = item.get("tags", [])
        primary = [t for t in tags if t in APPROVED_PRIMARY_TAGS]
        if not primary:
            untagged.append(item.get("name", "?"))

    if untagged:
        r.warn(f"{len(untagged)} items have no primary tags (acceptable if ≤9):")
        for name in untagged:
            r.warn(f"   → {repr(name)[:80]}")
        if len(untagged) > 9:
            r.error(f"Too many untagged items ({len(untagged)} > 9 threshold)")


def check_context_tags_not_standalone(items, r):
    """Context tags should not be the only tags on an item."""
    for item in items:
        tags = set(item.get("tags", []))
        primary = tags & APPROVED_PRIMARY_TAGS
        context = tags & APPROVED_CONTEXT_TAGS
        if context and not primary:
            r.error(f"Context tag(s) {context} on item with no primary tag: {repr(item.get('name','?'))[:80]}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"Validating: {DATA_FILE}")

    if not DATA_FILE.exists():
        print(f"✗ File not found: {DATA_FILE}")
        sys.exit(1)

    data = load(DATA_FILE)

    if not isinstance(data, list):
        print("✗ Root element must be a JSON array")
        sys.exit(1)

    print(f"  {len(data)} items loaded")

    r = Results()

    check_schema(data, r)
    check_no_duplicates(data, r)
    check_tag_vocabulary(data, r)
    check_coverage(data, r)
    check_no_primary_tags(data, r)
    check_context_tags_not_standalone(data, r)

    r.print_all()

    print()
    if r.passed:
        print("✅ PASSED" + (" (with warnings)" if r.warnings else ""))
    else:
        print(f"❌ FAILED — {len(r.errors)} error(s)")
        sys.exit(1)


if __name__ == "__main__":
    main()
