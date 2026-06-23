# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
"""
download_and_convert_kaggle.py
-------------------------------
WHAT THIS DOES (in plain English):
  1. Downloads the Symptom2Disease dataset from Kaggle (1,200 real examples)
  2. Maps each disease to our triage schema (score 1-5, department, criticalSymptoms)
  3. Converts each row to our training format { input, output }
  4. Merges with our synthetic data
  5. Saves the final combined dataset to triage_dataset.json

WHY KAGGLE DATA MAKES THE MODEL BETTER:
  Our synthetic data says "Patient presents with chest pain, sweating."
  Real Kaggle data says "I've been having this crushing feeling in my chest and I can't stop sweating."
  The model learns to handle BOTH — clean clinical language AND how real people actually talk.
"""

import json
import os
import subprocess
import sys
import csv
import random

# ─────────────────────────────────────────────────────────────
# DISEASE → TRIAGE MAPPING
# This is where we convert Kaggle's disease names to our schema
# We use clinical knowledge to assign the right score + department
# ─────────────────────────────────────────────────────────────

DISEASE_TO_TRIAGE = {
    # Level 5 — Critical (life-threatening, go to Emergency NOW)
    "Heart attack": {
        "severityScore": 5,
        "recommendedDepartment": "Cardiology",
        "criticalSymptoms": ["chest pain", "sweating", "shortness of breath"]
    },
    "Stroke": {
        "severityScore": 5,
        "recommendedDepartment": "Neurology",
        "criticalSymptoms": ["sudden numbness", "face drooping", "speech difficulty"]
    },

    # Level 4 — Emergent (serious, needs prompt attention)
    "Pneumonia": {
        "severityScore": 4,
        "recommendedDepartment": "Pulmonology",
        "criticalSymptoms": ["high fever", "difficulty breathing", "chest pain"]
    },
    "Typhoid": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["high fever", "abdominal pain", "weakness"]
    },
    "Dengue": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["high fever", "severe joint pain", "rash"]
    },
    "Malaria": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["high fever", "chills", "sweating"]
    },
    "Hepatitis B": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["jaundice", "severe fatigue", "abdominal pain"]
    },
    "Hepatitis C": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["jaundice", "fatigue", "dark urine"]
    },
    "Hepatitis D": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["jaundice", "fatigue", "abdominal pain"]
    },
    "Hepatitis E": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["jaundice", "nausea", "fatigue"]
    },
    "Hepatitis A": {
        "severityScore": 4,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["jaundice", "loss of appetite", "fatigue"]
    },

    # Level 3 — Urgent (needs care today, stable)
    "Diabetes": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["frequent urination", "excessive thirst", "fatigue"]
    },
    "Hypertension": {
        "severityScore": 3,
        "recommendedDepartment": "Cardiology",
        "criticalSymptoms": ["headache", "dizziness", "high blood pressure"]
    },
    "Tuberculosis": {
        "severityScore": 3,
        "recommendedDepartment": "Pulmonology",
        "criticalSymptoms": ["persistent cough", "blood in sputum", "night sweats"]
    },
    "Jaundice": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["yellow skin", "dark urine", "fatigue"]
    },
    "Chronic cholestasis": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["itching", "jaundice", "fatigue"]
    },
    "Migraine": {
        "severityScore": 3,
        "recommendedDepartment": "Neurology",
        "criticalSymptoms": ["severe headache", "nausea", "light sensitivity"]
    },
    "Peptic ulcer disease": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["stomach pain", "nausea", "vomiting"]
    },
    "Gastroenteritis": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["vomiting", "diarrhea", "stomach cramps"]
    },
    "Urinary tract infection": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["burning urination", "fever", "back pain"]
    },
    "Chicken pox": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["rash", "fever", "itching"]
    },

    # Level 2 — Semi-Urgent (can wait a few hours)
    "Fungal infection": {
        "severityScore": 2,
        "recommendedDepartment": "Dermatology",
        "criticalSymptoms": ["skin rash", "itching"]
    },
    "Allergy": {
        "severityScore": 2,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["rash", "sneezing", "itching"]
    },
    "Drug Reaction": {
        "severityScore": 2,
        "recommendedDepartment": "Dermatology",
        "criticalSymptoms": ["skin rash", "itching", "burning"]
    },
    "Psoriasis": {
        "severityScore": 2,
        "recommendedDepartment": "Dermatology",
        "criticalSymptoms": ["skin patches", "itching", "joint pain"]
    },
    "Impetigo": {
        "severityScore": 2,
        "recommendedDepartment": "Dermatology",
        "criticalSymptoms": ["skin sores", "rash", "blisters"]
    },
    "Acne": {
        "severityScore": 2,
        "recommendedDepartment": "Dermatology",
        "criticalSymptoms": ["skin inflammation", "pimples"]
    },

    # Level 1 — Non-Urgent / Routine
    "Common Cold": {
        "severityScore": 1,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": []
    },
    "Hypothyroidism": {
        "severityScore": 2,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["fatigue", "weight gain", "cold intolerance"]
    },
    "Hyperthyroidism": {
        "severityScore": 2,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["weight loss", "rapid heartbeat", "anxiety"]
    },
    "Hypoglycemia": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["dizziness", "sweating", "confusion"]
    },
    "Osteoarthritis": {
        "severityScore": 2,
        "recommendedDepartment": "Orthopedics",
        "criticalSymptoms": ["joint pain", "stiffness", "swelling"]
    },
    "Arthritis": {
        "severityScore": 2,
        "recommendedDepartment": "Orthopedics",
        "criticalSymptoms": ["joint pain", "swelling", "stiffness"]
    },
    "Vertigo": {
        "severityScore": 2,
        "recommendedDepartment": "ENT",
        "criticalSymptoms": ["dizziness", "spinning sensation", "nausea"]
    },
    "Bronchial Asthma": {
        "severityScore": 3,
        "recommendedDepartment": "Pulmonology",
        "criticalSymptoms": ["wheezing", "shortness of breath", "chest tightness"]
    },
    "Varicose veins": {
        "severityScore": 2,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["leg pain", "swelling", "visible veins"]
    },
    "AIDS": {
        "severityScore": 3,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["weight loss", "fatigue", "frequent infections"]
    },
    "Paralysis (brain hemorrhage)": {
        "severityScore": 5,
        "recommendedDepartment": "Neurology",
        "criticalSymptoms": ["sudden paralysis", "severe headache", "unconsciousness"]
    },
    "GERD": {
        "severityScore": 2,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["heartburn", "acid reflux", "chest discomfort"]
    },
    "Dimorphic hemorrhoids (piles)": {
        "severityScore": 2,
        "recommendedDepartment": "General Medicine",
        "criticalSymptoms": ["rectal bleeding", "pain", "swelling"]
    },
    "Cervical spondylosis": {
        "severityScore": 2,
        "recommendedDepartment": "Orthopedics",
        "criticalSymptoms": ["neck pain", "stiffness", "numbness"]
    },
}

def convert_kaggle_row(symptoms_text: str, disease: str) -> dict | None:
    """
    Takes one row from the Kaggle CSV and converts it to our training format.
    Returns None if the disease isn't in our mapping (we skip unknown diseases).
    """
    triage = DISEASE_TO_TRIAGE.get(disease)
    if not triage:
        return None  # Skip diseases we don't have a mapping for

    input_text = f"Triage the following patient symptoms: {symptoms_text.strip()}"

    # Build the clinical summary
    dept = triage["recommendedDepartment"]
    score = triage["severityScore"]
    summary_templates = [
        f"Patient presenting with symptoms consistent with {disease}; referred to {dept} at severity level {score}.",
        f"Clinical assessment suggests {disease}. {dept} evaluation recommended at level {score}.",
        f"Symptoms indicate possible {disease}. Triaged to {dept} with severity score {score}.",
    ]

    output = {
        "severityScore": triage["severityScore"],
        "recommendedDepartment": triage["recommendedDepartment"],
        "criticalSymptoms": triage["criticalSymptoms"],
        "clinicalSummary": random.choice(summary_templates)
    }

    return {
        "input": input_text,
        "output": json.dumps(output),
        "source": "kaggle"
    }


def download_kaggle_dataset():
    """Download the Symptom2Disease dataset using the Kaggle API token."""
    print("\n[DOWNLOADING] Symptom2Disease dataset from Kaggle...")

    token = os.environ.get("KAGGLE_API_TOKEN")
    if not token:
        print("[ERROR] KAGGLE_API_TOKEN environment variable not set.")
        print("   Set it with: $env:KAGGLE_API_TOKEN='your_token_here'")
        sys.exit(1)

    # Download using kaggle CLI
    result = subprocess.run(
        ["kaggle", "datasets", "download", "-d", "niyarrbarman/symptom2disease",
         "--unzip", "-p", "./kaggle_data"],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f"[ERROR] Download failed: {result.stderr}")
        sys.exit(1)

    print("[OK] Download complete!")


def load_kaggle_data() -> list:
    """Load and convert the downloaded Kaggle CSV file."""
    csv_path = "./kaggle_data/Symptom2Disease.csv"

    if not os.path.exists(csv_path):
        # Try finding any CSV in the kaggle_data folder
        for f in os.listdir("./kaggle_data"):
            if f.endswith(".csv"):
                csv_path = f"./kaggle_data/{f}"
                break

    print(f"\n[LOADING] Kaggle data from: {csv_path}")

    examples = []
    skipped = 0
    seen_diseases = set()

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # The CSV has columns: label (disease name), text (symptom description)
            disease = row.get("label", "").strip()
            symptoms = row.get("text", "").strip()

            if not disease or not symptoms:
                skipped += 1
                continue

            seen_diseases.add(disease)
            converted = convert_kaggle_row(symptoms, disease)

            if converted:
                examples.append(converted)
            else:
                skipped += 1

    print(f"[OK] Converted {len(examples)} Kaggle examples")
    print(f"[SKIPPED] {skipped} rows (unknown diseases or empty rows)")
    print(f"[DISEASES] Found in dataset: {', '.join(sorted(seen_diseases))}")

    return examples


def load_synthetic_data() -> list:
    """Load our existing synthetic data."""
    path = "./triage_dataset_synthetic.json"
    if not os.path.exists(path):
        print("⚠️  Synthetic dataset not found. Run generate_training_data.py first!")
        return []

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Tag synthetic examples with their source
    for item in data:
        item["source"] = "synthetic"

    print(f"[OK] Loaded {len(data)} synthetic examples")
    return data


def main():
    print("[CLINICQUEUE] Kaggle Data Downloader & Combiner")
    print("=" * 55)

    # Step 1: Download from Kaggle
    download_kaggle_dataset()

    # Step 2: Convert Kaggle data
    kaggle_examples = load_kaggle_data()

    # Step 3: Load our synthetic data
    synthetic_examples = load_synthetic_data()

    # Step 4: Combine and shuffle
    all_examples = kaggle_examples + synthetic_examples
    random.shuffle(all_examples)

    # Step 5: Show breakdown
    print(f"\n[STATS] Final Dataset Breakdown:")
    print(f"   Kaggle (real data):     {len(kaggle_examples):>4} examples")
    print(f"   Synthetic (our rules):  {len(synthetic_examples):>4} examples")
    print(f"   " + "-" * 29)
    print(f"   Total:                  {len(all_examples):>4} examples")

    # Score distribution
    score_counts = {}
    for ex in all_examples:
        output = json.loads(ex["output"])
        score = output["severityScore"]
        score_counts[score] = score_counts.get(score, 0) + 1

    print(f"\n[DISTRIBUTION] Score Distribution:")
    for score in sorted(score_counts.keys()):
        bar = "#" * (score_counts[score] // 10)
        print(f"   Level {score}: {score_counts[score]:>4} examples  {bar}")

    # Step 6: Save combined dataset (strip source tag for training)
    training_data = [{"input": ex["input"], "output": ex["output"]} for ex in all_examples]

    with open("triage_dataset.json", "w", encoding="utf-8") as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Combined dataset saved to: triage_dataset.json")
    print(f"\nSample entry (from Kaggle):")
    kaggle_sample = next((ex for ex in all_examples if ex.get("source") == "kaggle"), None)
    if kaggle_sample:
        print(f"  INPUT:  {kaggle_sample['input'][:120]}...")
        print(f"  OUTPUT: {kaggle_sample['output']}")


if __name__ == "__main__":
    main()
