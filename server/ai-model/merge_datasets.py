# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
"""
merge_datasets.py
-----------------
Merges already-downloaded Kaggle CSV with the newly generated synthetic JSON.
Run this instead of download_and_convert_kaggle.py when the CSV is already present.
"""

import json
import random
import csv
import os

KAGGLE_CSV   = os.path.join("kaggle_data", "Symptom2Disease.csv")
SYNTHETIC    = "triage_dataset_synthetic.json"
OUTPUT       = "triage_dataset.json"

# ── Disease → Triage mapping ──────────────────────────────────────────────────
DISEASE_MAP = {
    "Psoriasis":                  (2, "Dermatology"),
    "Varicose Veins":             (2, "General Medicine"),
    "Typhoid":                    (3, "General Medicine"),
    "Chicken pox":                (2, "General Medicine"),
    "Impetigo":                   (2, "Dermatology"),
    "Dengue":                     (4, "Emergency"),
    "Fungal infection":           (1, "Dermatology"),
    "Common Cold":                (1, "General Medicine"),
    "Pneumonia":                  (4, "Pulmonology"),
    "Dimorphic Hemorrhoids":      (2, "General Medicine"),
    "Arthritis":                  (2, "Orthopedics"),
    "Acne":                       (1, "Dermatology"),
    "Bronchial Asthma":           (3, "Pulmonology"),
    "Hypertension":               (3, "Cardiology"),
    "Migraine":                   (3, "Neurology"),
    "Cervical spondylosis":       (2, "Orthopedics"),
    "Jaundice":                   (3, "General Medicine"),
    "Malaria":                    (4, "Emergency"),
    "urinary tract infection":    (3, "General Medicine"),
    "Allergy":                    (2, "General Medicine"),
    "Gastroenteritis":            (3, "General Medicine"),
    "GERD":                       (2, "General Medicine"),
    "Chronic cholestasis":        (3, "General Medicine"),
    "Drug Reaction":              (3, "Emergency"),
    "Peptic ulcer disease":       (3, "General Medicine"),
    "Diabetes":                   (2, "General Medicine"),
    "Paralysis (brain hemorrhage)": (5, "Neurology"),
    "Cervical spondylosis":       (2, "Orthopedics"),
    "Heart attack":               (5, "Cardiology"),
    "Tuberculosis":               (4, "Pulmonology"),
    "Hepatitis A":                (3, "General Medicine"),
    "Hepatitis B":                (3, "General Medicine"),
    "Hepatitis C":                (3, "General Medicine"),
    "Hepatitis D":                (3, "General Medicine"),
    "Hepatitis E":                (3, "General Medicine"),
    "Alcoholic hepatitis":        (4, "General Medicine"),
    "Hypoglycemia":               (4, "Emergency"),
    "Osteoarthritis":             (2, "Orthopedics"),
    "Hypothyroidism":             (2, "General Medicine"),
    "Hyperthyroidism":            (3, "General Medicine"),
}

def build_output(score, department, symptom_text):
    keywords = ["pain","bleeding","breathing","fever","vomiting","rash","swelling","infection"]
    critical = [w for w in symptom_text.split(",") if any(k in w.lower() for k in keywords)][:3]
    summaries = [
        f"Patient triaged with severity score {score} to {department}.",
        f"Assessment complete. Score {score}; referred to {department}.",
        f"Clinical review indicates {department} at level {score}.",
    ]
    return {
        "severityScore": score,
        "recommendedDepartment": department,
        "criticalSymptoms": [c.strip() for c in critical],
        "clinicalSummary": random.choice(summaries)
    }


def convert_kaggle(csv_path):
    examples = []
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            disease = row.get("label", "").strip()
            symptoms = row.get("text", "").strip()
            if not disease or not symptoms:
                continue
            mapping = DISEASE_MAP.get(disease)
            if not mapping:
                continue
            score, department = mapping
            output = build_output(score, department, symptoms)
            examples.append({
                "input": f"Triage the following patient symptoms: {symptoms}",
                "output": json.dumps(output)
            })
    return examples


def main():
    print("[MERGE] Loading synthetic examples...")
    with open(SYNTHETIC, encoding="utf-8") as f:
        synthetic = json.load(f)
    print(f"  Synthetic : {len(synthetic)} examples")

    print("[MERGE] Converting Kaggle data...")
    kaggle = convert_kaggle(KAGGLE_CSV)
    print(f"  Kaggle    : {len(kaggle)} examples")

    combined = synthetic + kaggle
    random.shuffle(combined)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Combined dataset : {len(combined)} examples")
    print(f"[FILE] Saved to         : {OUTPUT}")

    # Distribution
    from collections import Counter
    scores = [json.loads(e["output"])["severityScore"] for e in combined]
    print("\n[DISTRIBUTION]")
    for lvl, cnt in sorted(Counter(scores).items()):
        bar = "#" * (cnt // 25)
        print(f"  Level {lvl}: {cnt:4d}  {bar}")


if __name__ == "__main__":
    main()
