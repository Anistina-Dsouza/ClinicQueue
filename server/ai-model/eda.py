# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
"""
eda.py — Exploratory Data Analysis for triage_dataset.json
-----------------------------------------------------------
Runs the same checks a professional data analyst would run
before handing data off to a machine learning engineer.

Sections:
  1. Basic Shape & Size
  2. Class Distribution (Severity Levels)
  3. Department Distribution
  4. Schema Validation (missing / malformed fields)
  5. Duplicate Detection
  6. Text Length Analysis
  7. Critical Symptoms Analysis
  8. Token Length Check (flan-t5 has a 512-token hard limit)
  9. Sample Entries per Level
  10. Summary & Recommendations
"""

import json
import re
from collections import Counter, defaultdict

# ── Load dataset ──────────────────────────────────────────────
DATASET_PATH = "triage_dataset.json"

with open(DATASET_PATH, encoding="utf-8") as f:
    data = json.load(f)

TOTAL = len(data)

LEVEL_LABELS = {
    1: "Non-Urgent   ",
    2: "Semi-Urgent  ",
    3: "Urgent       ",
    4: "Emergent     ",
    5: "Critical     ",
}

SEP  = "=" * 62
SEP2 = "-" * 62

def bar(count, total, width=30):
    filled = int(round(count / total * width))
    return "[" + "#" * filled + " " * (width - filled) + "]"

def section(title):
    print(f"\n{SEP}")
    print(f"  {title}")
    print(SEP)


# ═══════════════════════════════════════════════════════════════
# 1. BASIC SHAPE & SIZE
# ═══════════════════════════════════════════════════════════════
section("1. BASIC SHAPE & SIZE")

print(f"  Total examples      : {TOTAL:,}")
print(f"  Dataset file size   : {round(open(DATASET_PATH).seek(0, 2) or 0)} bytes")

import os
size_kb = os.path.getsize(DATASET_PATH) / 1024
print(f"  File size on disk   : {size_kb:.1f} KB  ({size_kb/1024:.2f} MB)")
print(f"  Fields per entry    : input, output")
print(f"  Output fields       : severityScore, recommendedDepartment,")
print(f"                        criticalSymptoms, clinicalSummary")


# ═══════════════════════════════════════════════════════════════
# 2. CLASS DISTRIBUTION — SEVERITY LEVELS
# ═══════════════════════════════════════════════════════════════
section("2. CLASS DISTRIBUTION — SEVERITY LEVELS")

scores = []
parse_errors = []

parsed_outputs = []
for i, entry in enumerate(data):
    try:
        out = json.loads(entry["output"])
        parsed_outputs.append(out)
        scores.append(out["severityScore"])
    except Exception as e:
        parse_errors.append((i, str(e)))
        parsed_outputs.append(None)

score_counts = Counter(scores)

print(f"  {'Level':<8} {'Label':<16} {'Count':>6}  {'%':>6}  Distribution")
print(f"  {SEP2}")
for lvl in sorted(score_counts):
    cnt = score_counts[lvl]
    pct = cnt / TOTAL * 100
    label = LEVEL_LABELS.get(lvl, "Unknown      ")
    print(f"  L{lvl}      {label} {cnt:>6}  {pct:>5.1f}%  {bar(cnt, TOTAL)}")

print(f"\n  {'TOTAL':<8} {'':16} {TOTAL:>6}  100.0%")

# Imbalance check
max_cnt = max(score_counts.values())
min_cnt = min(score_counts.values())
ratio = max_cnt / min_cnt
print(f"\n  Imbalance ratio (max/min): {ratio:.2f}x", end="  ")
if ratio < 2:
    print("[GOOD — well balanced]")
elif ratio < 3:
    print("[ACCEPTABLE — minor imbalance]")
else:
    print("[WARNING — significant imbalance, consider oversampling]")


# ═══════════════════════════════════════════════════════════════
# 3. DEPARTMENT DISTRIBUTION
# ═══════════════════════════════════════════════════════════════
section("3. DEPARTMENT DISTRIBUTION")

depts = [p["recommendedDepartment"] for p in parsed_outputs if p]
dept_counts = Counter(depts)

print(f"  {'Department':<28} {'Count':>6}  {'%':>6}  Bar")
print(f"  {SEP2}")
for dept, cnt in dept_counts.most_common():
    pct = cnt / TOTAL * 100
    print(f"  {dept:<28} {cnt:>6}  {pct:>5.1f}%  {bar(cnt, TOTAL, 20)}")

print(f"\n  Unique departments: {len(dept_counts)}")


# ═══════════════════════════════════════════════════════════════
# 4. SCHEMA VALIDATION
# ═══════════════════════════════════════════════════════════════
section("4. SCHEMA VALIDATION — Missing / Malformed Fields")

required_output_fields = ["severityScore", "recommendedDepartment", "criticalSymptoms", "clinicalSummary"]
missing_field_counts = defaultdict(int)
invalid_score = 0
empty_input = 0
empty_summary = 0

for i, (entry, parsed) in enumerate(zip(data, parsed_outputs)):
    # Check input
    if not entry.get("input", "").strip():
        empty_input += 1

    if parsed is None:
        for f in required_output_fields:
            missing_field_counts[f] += 1
        continue

    # Check required fields present
    for f in required_output_fields:
        if f not in parsed:
            missing_field_counts[f] += 1

    # Check score is 1–5
    if parsed.get("severityScore") not in [1, 2, 3, 4, 5]:
        invalid_score += 1

    # Check clinical summary not empty
    if not parsed.get("clinicalSummary", "").strip():
        empty_summary += 1

print(f"  JSON parse errors          : {len(parse_errors)}")
print(f"  Empty input texts          : {empty_input}")
print(f"  Invalid severity scores    : {invalid_score}")
print(f"  Empty clinical summaries   : {empty_summary}")
for field, cnt in missing_field_counts.items():
    print(f"  Missing field '{field}': {cnt}")

total_issues = len(parse_errors) + empty_input + invalid_score + empty_summary + sum(missing_field_counts.values())
if total_issues == 0:
    print(f"\n  [PASS] Schema is clean — no issues found.")
else:
    print(f"\n  [FAIL] {total_issues} total issues found. Review before training.")


# ═══════════════════════════════════════════════════════════════
# 5. DUPLICATE DETECTION
# ═══════════════════════════════════════════════════════════════
section("5. DUPLICATE DETECTION")

inputs = [e["input"].strip().lower() for e in data]
input_counts = Counter(inputs)
exact_dupes = sum(1 for c in input_counts.values() if c > 1)
exact_dupe_examples = sum(c - 1 for c in input_counts.values() if c > 1)

print(f"  Unique input texts         : {len(input_counts):,}")
print(f"  Inputs appearing 2+ times  : {exact_dupes}")
print(f"  Total duplicate rows       : {exact_dupe_examples}")

if exact_dupes == 0:
    print(f"\n  [PASS] No exact duplicate inputs found.")
else:
    pct = exact_dupe_examples / TOTAL * 100
    print(f"\n  [WARNING] {pct:.1f}% of rows are exact duplicates.")
    print(f"  Sample duplicate:")
    for text, cnt in input_counts.most_common(1):
        print(f"    \"{text[:80]}...\" appears {cnt}x")


# ═══════════════════════════════════════════════════════════════
# 6. TEXT LENGTH ANALYSIS
# ═══════════════════════════════════════════════════════════════
section("6. TEXT LENGTH ANALYSIS (characters)")

input_lens  = [len(e["input"]) for e in data]
output_lens = [len(e["output"]) for e in data]

def stats(name, lengths):
    lengths_sorted = sorted(lengths)
    n = len(lengths_sorted)
    mean  = sum(lengths_sorted) / n
    p50   = lengths_sorted[n // 2]
    p95   = lengths_sorted[int(n * 0.95)]
    p99   = lengths_sorted[int(n * 0.99)]
    mx    = lengths_sorted[-1]
    mn    = lengths_sorted[0]
    print(f"  {name}")
    print(f"    Min  : {mn:,} chars")
    print(f"    Mean : {mean:,.0f} chars")
    print(f"    p50  : {p50:,} chars")
    print(f"    p95  : {p95:,} chars")
    print(f"    p99  : {p99:,} chars")
    print(f"    Max  : {mx:,} chars")

stats("INPUT  (symptom text):", input_lens)
print()
stats("OUTPUT (JSON answer): ", output_lens)


# ═══════════════════════════════════════════════════════════════
# 7. CRITICAL SYMPTOMS ANALYSIS
# ═══════════════════════════════════════════════════════════════
section("7. CRITICAL SYMPTOMS ANALYSIS")

all_critical = []
empty_critical = 0
for p in parsed_outputs:
    if p is None:
        continue
    cs = p.get("criticalSymptoms", [])
    if not cs:
        empty_critical += 1
    all_critical.extend(cs)

critical_counts = Counter(all_critical)
print(f"  Total critical symptom tags : {len(all_critical):,}")
print(f"  Unique symptom phrases      : {len(critical_counts):,}")
print(f"  Entries with no tags        : {empty_critical}")
print(f"\n  Top 15 most-flagged symptoms:")
print(f"  {'Symptom':<45} Count")
print(f"  {'-'*55}")
for symptom, cnt in critical_counts.most_common(15):
    print(f"  {symptom:<45} {cnt:>5}")


# ═══════════════════════════════════════════════════════════════
# 8. TOKEN LENGTH CHECK (flan-t5 limit = 512 tokens)
# ═══════════════════════════════════════════════════════════════
section("8. TOKEN LENGTH CHECK (flan-t5 512-token hard limit)")

# Rough estimate: 1 token ≈ 4 characters (standard rule of thumb)
CHARS_PER_TOKEN = 4
TOKEN_LIMIT = 512

over_limit_input  = sum(1 for l in input_lens  if l // CHARS_PER_TOKEN > TOKEN_LIMIT)
over_limit_output = sum(1 for l in output_lens if l // CHARS_PER_TOKEN > TOKEN_LIMIT)
max_input_tokens  = max(input_lens)  // CHARS_PER_TOKEN
max_output_tokens = max(output_lens) // CHARS_PER_TOKEN
avg_input_tokens  = int(sum(input_lens) / TOTAL / CHARS_PER_TOKEN)
avg_output_tokens = int(sum(output_lens) / TOTAL / CHARS_PER_TOKEN)

print(f"  Estimated tokens (chars / 4 rule):")
print(f"    Input  — avg: ~{avg_input_tokens} tokens  max: ~{max_input_tokens} tokens")
print(f"    Output — avg: ~{avg_output_tokens} tokens  max: ~{max_output_tokens} tokens")
print(f"\n  Inputs  exceeding 512-token limit : {over_limit_input}")
print(f"  Outputs exceeding 512-token limit : {over_limit_output}")

if over_limit_input == 0 and over_limit_output == 0:
    print(f"\n  [PASS] All entries are within flan-t5's token limits.")
else:
    print(f"\n  [WARNING] Some entries may be truncated during training.")


# ═══════════════════════════════════════════════════════════════
# 9. SAMPLE ENTRIES PER LEVEL
# ═══════════════════════════════════════════════════════════════
section("9. SAMPLE ENTRIES — One per Severity Level")

samples_by_level = defaultdict(list)
for entry, parsed in zip(data, parsed_outputs):
    if parsed:
        samples_by_level[parsed["severityScore"]].append((entry, parsed))

import random
random.seed(42)
for lvl in sorted(samples_by_level):
    entry, parsed = random.choice(samples_by_level[lvl])
    print(f"\n  --- Level {lvl} ({LEVEL_LABELS[lvl].strip()}) ---")
    print(f"  INPUT : {entry['input'][:120]}...")
    print(f"  DEPT  : {parsed['recommendedDepartment']}")
    print(f"  SCORE : {parsed['severityScore']}")
    print(f"  FLAGS : {parsed['criticalSymptoms']}")


# ═══════════════════════════════════════════════════════════════
# 10. SUMMARY & RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════════
section("10. SUMMARY & RECOMMENDATIONS")

print(f"""
  DATASET STATISTICS
  ------------------
  Total examples        : {TOTAL:,}
  Severity levels       : 5 (1 through 5)
  Departments covered   : {len(dept_counts)}
  Parse errors          : {len(parse_errors)}
  Exact duplicates      : {exact_dupe_examples}
  Schema issues         : {total_issues}

  DATA QUALITY
  ------------
  Schema validity       : {"PASS" if total_issues == 0 else "ISSUES FOUND"}
  Duplicate rate        : {exact_dupe_examples / TOTAL * 100:.2f}%
  Token limit breaches  : {over_limit_input + over_limit_output}
  Class imbalance ratio : {ratio:.2f}x ({"acceptable" if ratio < 3 else "review needed"})

  RECOMMENDATIONS
  ---------------""")

recs = []
if ratio >= 3:
    recs.append("Consider oversampling underrepresented severity levels before training.")
if exact_dupe_examples > TOTAL * 0.05:
    recs.append("Deduplicate — more than 5% of entries are exact duplicates.")
if total_issues > 0:
    recs.append(f"Fix {total_issues} schema issues before training.")
if over_limit_input + over_limit_output > 0:
    recs.append("Truncate entries exceeding 512 tokens.")
if not recs:
    recs.append("Dataset looks clean and ready for fine-tuning!")
    recs.append("Proceed to training with flan-t5-base.")

for r in recs:
    print(f"  -> {r}")

print(f"\n{SEP}\n")
