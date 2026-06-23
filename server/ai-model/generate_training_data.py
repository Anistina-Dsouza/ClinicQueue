# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
"""
generate_training_data.py
--------------------------
WHAT THIS DOES (in plain English):
  - Creates 800+ realistic symptom examples with correct triage answers
  - Uses the same clinical rules as our triagePrompt.js
  - Saves everything to triage_dataset.json

WHY WE NEED IT:
  - AI models learn from examples, not from rules written in English
  - We can't hand-write 800 examples, so we generate them automatically
  - The more varied the examples, the better the model learns

HOW IT WORKS:
  - We have a list of symptom "templates" for each severity level (1-5)
  - We randomly mix and combine them to create variety
  - We save each one as { input: "symptoms text", output: "json answer" }
"""

import json
import random

# ─────────────────────────────────────────────────────────────
# SYMPTOM TEMPLATES — organised by severity level
# Each level has symptom phrases + the correct department
# ─────────────────────────────────────────────────────────────

SEVERITY_5_CRITICAL = {
    "department": ["Emergency", "Cardiology", "Neurology"],
    "symptom_sets": [
        (["severe chest pain", "radiating to left arm", "sweating", "nausea"], "Cardiology"),
        (["sudden numbness on one side of face", "slurred speech", "confusion"], "Neurology"),
        (["severe difficulty breathing", "lips turning blue", "cannot speak"], "Emergency"),
        (["unresponsive patient", "no pulse found by bystander"], "Emergency"),
        (["major bleeding from wound", "blood soaking through bandages"], "Emergency"),
        (["severe allergic reaction", "throat swelling", "face swelling", "hives everywhere"], "Emergency"),
        (["sudden severe headache", "worst headache of my life", "neck stiffness", "vomiting"], "Neurology"),
        (["crushing chest pressure", "cannot move left arm", "profuse sweating", "pale skin"], "Cardiology"),
        (["high fever 104 degrees", "stiff neck", "sensitivity to light", "severe headache"], "Emergency"),
        (["fell unconscious", "seizure lasting 5 minutes", "not responding to voice"], "Emergency"),
        (["severe asthma attack", "inhaler not helping", "turning blue", "cannot speak"], "Emergency"),
        (["gunshot wound to chest", "difficulty breathing", "coughing blood"], "Emergency"),
        (["overdose", "unconscious", "shallow breathing", "won't wake up"], "Emergency"),
        (["severe burn covering both arms", "skin peeling off", "severe pain"], "Emergency"),
        (["diabetic in coma", "blood sugar extremely low", "not waking up"], "Emergency"),
    ]
}

SEVERITY_4_EMERGENT = {
    "symptom_sets": [
        (["high fever 103 degrees in 8 month old baby", "not eating", "very lethargic"], "Pediatrics"),
        (["bone sticking out of skin", "compound fracture", "severe pain in leg"], "Emergency"),
        (["moderate difficulty breathing", "acute asthma attack", "wheezing loudly"], "Pulmonology"),
        (["severe abdominal pain", "cannot stand straight", "vomiting blood"], "Emergency"),
        (["sudden severe headache", "worse than any headache before", "one side of head"], "Neurology"),
        (["severe dehydration", "not urinated in 12 hours", "dizziness when standing"], "Emergency"),
        (["chest pain with deep breathing", "coughing blood", "recent long flight"], "Cardiology"),
        (["very high fever 102 in child under 2", "febrile seizure", "shaking"], "Pediatrics"),
        (["severe electric shock", "burn marks on hands", "irregular heartbeat"], "Emergency"),
        (["eye injury from chemical splash", "severe eye pain", "cannot open eye"], "Emergency"),
        (["suspected appendicitis", "severe right lower abdominal pain", "fever", "nausea"], "Emergency"),
        (["head injury from fall", "loss of consciousness for 1 minute", "now confused"], "Emergency"),
        (["kidney stone", "severe flank pain", "cannot find comfortable position", "blood in urine"], "Emergency"),
        (["hypertensive crisis", "blood pressure 200/120", "severe headache", "blurry vision"], "Cardiology"),
        (["severe infection", "spreading redness on leg", "red streaks", "high fever"], "Emergency"),
    ]
}

SEVERITY_3_URGENT = {
    "symptom_sets": [
        (["mild difficulty breathing", "wheezing", "mild asthma"], "Pulmonology"),
        (["deep cut on hand", "needs stitches", "bleeding controlled"], "General Medicine"),
        (["urinary tract infection", "fever 101", "burning urination", "back pain"], "General Medicine"),
        (["persistent vomiting", "cannot keep food down for 6 hours", "dehydrated"], "General Medicine"),
        (["minor fracture", "x-ray shows hairline crack in wrist", "moderate pain"], "Orthopedics"),
        (["high fever 101 for 3 days", "productive cough", "chest tightness"], "Pulmonology"),
        (["migraine", "throbbing headache for hours", "light sensitivity", "vomiting once"], "Neurology"),
        (["animal bite", "dog bite on hand", "wound needs cleaning and rabies check"], "General Medicine"),
        (["foreign object in ear", "child put bead in ear", "cannot remove"], "ENT"),
        (["moderate ankle sprain", "swelling", "cannot bear full weight"], "Orthopedics"),
        (["eye redness and pain", "blurry vision", "possible corneal scratch"], "General Medicine"),
        (["abdominal pain", "nausea vomiting", "moderate pain 5 out of 10"], "General Medicine"),
        (["skin infection", "cellulitis on forearm", "warm red swollen"], "Dermatology"),
        (["tooth pain radiating to jaw", "facial swelling", "dental abscess"], "ENT"),
        (["child fever 102", "ear pulling", "crying", "ear infection suspected"], "Pediatrics"),
    ]
}

SEVERITY_2_SEMI_URGENT = {
    "symptom_sets": [
        (["minor ankle sprain", "mild swelling", "able to walk"], "Orthopedics"),
        (["earache", "mild ear pain", "no fever", "hearing muffled"], "ENT"),
        (["sore throat", "mild difficulty swallowing", "no fever"], "ENT"),
        (["low grade fever 99", "mild body aches", "feeling unwell"], "General Medicine"),
        (["mild urinary discomfort", "no fever", "slight burning"], "General Medicine"),
        (["minor cut on finger", "cleaned at home", "needs dressing check"], "General Medicine"),
        (["back pain", "pulled muscle", "moderate pain", "no numbness"], "General Medicine"),
        (["mild skin rash", "itching", "no spreading", "no fever"], "Dermatology"),
        (["mild toothache", "no swelling", "can wait for dentist"], "ENT"),
        (["eye irritation", "mild redness", "no pain", "feels like something inside"], "General Medicine"),
        (["constipation", "no bowel movement for 3 days", "mild cramping"], "General Medicine"),
        (["mild headache", "tension headache", "responsive to paracetamol"], "General Medicine"),
        (["insect bite", "localized swelling", "mild itching", "no allergic reaction signs"], "Dermatology"),
        (["mild knee pain", "no swelling", "no locking", "overuse injury"], "Orthopedics"),
        (["pink eye", "eye discharge", "mild redness", "no pain"], "General Medicine"),
    ]
}

SEVERITY_1_NON_URGENT = {
    "symptom_sets": [
        (["routine annual checkup", "no complaints", "general wellness exam"], "General Medicine"),
        (["prescription refill needed", "blood pressure medication running low"], "General Medicine"),
        (["mild cold", "stuffy nose", "slight cough", "no fever", "no breathing issues"], "General Medicine"),
        (["vaccination requested", "flu shot needed", "child immunisation schedule"], "Pediatrics"),
        (["mild skin rash", "no itching", "no fever", "been there a week"], "Dermatology"),
        (["routine blood test results review", "follow up visit"], "General Medicine"),
        (["mild acne", "seeking dermatology advice", "no pain"], "Dermatology"),
        (["vitamin deficiency follow up", "feeling slightly tired", "routine"], "General Medicine"),
        (["allergy medicine refill", "seasonal allergies", "well controlled"], "General Medicine"),
        (["minor bruise", "bumped knee yesterday", "no swelling", "no pain now"], "General Medicine"),
        (["child growth checkup", "6 month well baby visit", "no concerns"], "Pediatrics"),
        (["weight management consultation", "no acute complaints"], "General Medicine"),
        (["minor paper cut", "superficial", "already stopped bleeding"], "General Medicine"),
        (["post surgery follow up", "healing well", "no concerns", "suture removal"], "General Medicine"),
        (["sleep issues", "mild insomnia", "no other complaints"], "General Medicine"),
    ]
}

# ─────────────────────────────────────────────────────────────
# HELPER: Turn a list of symptoms into a natural sentence
# ─────────────────────────────────────────────────────────────

def symptoms_to_text(symptoms: list) -> str:
    """
    Takes ["chest pain", "sweating"] and turns it into
    "Patient presents with chest pain, sweating."
    We add variety using different openers.
    """
    openers = [
        "Patient presents with",
        "Patient complains of",
        "Patient reports",
        "Chief complaint:",
        "Patient came in with",
        "Patient is experiencing",
        "Patient describes",
        "",  # Sometimes no opener, just symptoms
    ]
    opener = random.choice(openers)
    symptom_text = ", ".join(symptoms)
    
    if opener:
        return f"{opener} {symptom_text}."
    else:
        return f"{symptom_text.capitalize()}."


# ─────────────────────────────────────────────────────────────
# CRITICAL SYMPTOMS — red flag phrases by severity
# ─────────────────────────────────────────────────────────────

CRITICAL_BY_LEVEL = {
    5: ["chest pain", "difficulty breathing", "unconscious", "bleeding", "stroke symptoms", "anaphylaxis", "seizure"],
    4: ["high fever", "compound fracture", "severe pain", "blood in vomit", "loss of consciousness"],
    3: ["fever", "vomiting", "fracture", "deep laceration"],
    2: [],
    1: [],
}

def get_clinical_summary(symptoms: list, score: int, department: str) -> str:
    """Create a short clinical summary sentence."""
    brief = symptoms[0] if symptoms else "presented symptoms"
    summaries = [
        f"Patient presenting with {brief}; triaged to {department} with severity level {score}.",
        f"Assessment: {brief}. Recommended for {department} evaluation.",
        f"Clinical review of {brief} indicates {department} referral at severity {score}.",
        f"Patient with {brief}; immediate {department} assessment required at level {score}.",
    ]
    return random.choice(summaries)


# ─────────────────────────────────────────────────────────────
# MAIN GENERATOR
# ─────────────────────────────────────────────────────────────

def generate_examples(severity_data: dict, score: int, count: int) -> list:
    """Generate `count` training examples for a given severity level."""
    examples = []
    symptom_sets = severity_data["symptom_sets"]
    
    for _ in range(count):
        # Pick a random symptom set
        symptoms_tuple = random.choice(symptom_sets)
        symptoms, department = symptoms_tuple
        
        # Add slight variation — randomly drop or keep one symptom
        working_symptoms = list(symptoms)
        if len(working_symptoms) > 2 and random.random() > 0.6:
            working_symptoms = working_symptoms[:random.randint(2, len(working_symptoms))]
        
        # Build the text input
        input_text = f"Triage the following patient symptoms: {symptoms_to_text(working_symptoms)}"
        
        # Build the correct output (the "answer")
        critical = [s for s in working_symptoms if any(
            kw in s.lower() for kw in ["pain", "bleeding", "breathing", "conscious", "fever", "seizure", "vomit", "fracture", "burn"]
        )]
        
        output = {
            "severityScore": score,
            "recommendedDepartment": department,
            "criticalSymptoms": critical[:3],  # max 3 critical flags
            "clinicalSummary": get_clinical_summary(working_symptoms, score, department)
        }
        
        examples.append({
            "input": input_text,
            "output": json.dumps(output)
        })
    
    return examples


def main():
    print("[CLINICQUEUE] Triage Training Data Generator")
    print("=" * 50)
    
    all_examples = []
    
    # Generate examples for each severity level
    # We generate slightly more for middle levels (2, 3, 4) 
    # because that's where triage is most nuanced
    level_config = [
        (SEVERITY_5_CRITICAL, 5, 120),
        (SEVERITY_4_EMERGENT, 4, 160),
        (SEVERITY_3_URGENT,   3, 200),
        (SEVERITY_2_SEMI_URGENT, 2, 160),
        (SEVERITY_1_NON_URGENT,  1, 120),
    ]
    
    for data, score, count in level_config:
        examples = generate_examples(data, score, count)
        all_examples.extend(examples)
        print(f"  [OK] Level {score}: Generated {len(examples)} examples")
    
    # Shuffle so the model doesn't see all level-5s then all level-1s
    random.shuffle(all_examples)
    
    # Save to file
    output_path = "triage_dataset_synthetic.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_examples, f, indent=2, ensure_ascii=False)
    
    print(f"\n[DONE] Generated {len(all_examples)} total training examples")
    print(f"[FILE] Saved to: {output_path}")
    print(f"\nSample entry:")
    sample = all_examples[0]
    print(f"  INPUT:  {sample['input']}")
    print(f"  OUTPUT: {sample['output']}")


if __name__ == "__main__":
    main()
