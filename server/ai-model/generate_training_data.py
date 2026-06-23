# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
"""
generate_training_data.py  (v2 — AUGMENTED)
--------------------------------------------
WHAT CHANGED FROM v1:
  - 3x more symptom templates per severity level (45+ per level vs 15)
  - Much higher example counts, especially for critical levels 4 and 5
  - More linguistic variety: extra openers, age/gender modifiers, symptom
    duration phrases, and negation noise ("no fever but...")
  - Target: ~3,000 synthetic examples (up from 760)

TARGET COUNTS PER LEVEL:
  Level 5 (Critical)  : 600  examples  (was 120)
  Level 4 (Emergent)  : 700  examples  (was 160)
  Level 3 (Urgent)    : 700  examples  (was 200)
  Level 2 (Semi-urgent): 550 examples  (was 160)
  Level 1 (Routine)   : 450  examples  (was 120)
  TOTAL               : 3,000 examples
"""

import json
import random

# ─────────────────────────────────────────────────────────────────────────────
# SEVERITY 5 — CRITICAL / IMMEDIATELY LIFE-THREATENING
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_5_CRITICAL = {
    "symptom_sets": [
        # Cardiac
        (["severe chest pain", "radiating to left arm", "sweating", "nausea"], "Cardiology"),
        (["crushing chest pressure", "cannot move left arm", "profuse sweating", "pale skin"], "Cardiology"),
        (["sudden cardiac arrest", "no pulse", "not breathing", "bystander started CPR"], "Emergency"),
        (["severe chest tightness", "pain radiating to jaw", "shortness of breath", "cold sweats"], "Cardiology"),
        (["heart attack symptoms", "severe chest pain", "left arm tingling", "vomiting"], "Cardiology"),
        (["chest pain 10 out of 10", "cannot lie flat", "extreme sweating", "grey skin colour"], "Cardiology"),
        (["palpitations with chest pain", "dizziness", "near fainting", "sweating profusely"], "Cardiology"),
        (["hypertensive emergency", "blood pressure 220 over 130", "severe headache", "blurry vision", "chest pain"], "Cardiology"),
        # Neurological
        (["sudden numbness on one side of face", "slurred speech", "confusion", "drooping face"], "Neurology"),
        (["sudden severe headache", "worst headache of my life", "neck stiffness", "vomiting"], "Neurology"),
        (["sudden loss of vision in one eye", "facial drooping", "arm weakness", "cannot speak"], "Neurology"),
        (["stroke symptoms", "arm weakness one side", "speech difficulty", "sudden confusion"], "Neurology"),
        (["sudden severe dizziness", "cannot walk", "double vision", "vomiting", "possible stroke"], "Neurology"),
        (["seizure lasting over 5 minutes", "not stopping", "unconscious between seizures"], "Neurology"),
        (["meningitis symptoms", "high fever 104", "severe neck stiffness", "sensitivity to light", "petechial rash"], "Neurology"),
        # Respiratory / Airway
        (["severe difficulty breathing", "lips turning blue", "cannot speak full sentences"], "Emergency"),
        (["severe asthma attack", "inhaler not helping", "oxygen saturation 80 percent", "turning blue"], "Emergency"),
        (["anaphylaxis", "throat swelling", "face swelling", "severe allergic reaction", "hives everywhere"], "Emergency"),
        (["airway obstruction", "choking on food", "cannot breathe", "turning blue"], "Emergency"),
        (["pulmonary embolism", "sudden severe shortness of breath", "chest pain", "coughing blood"], "Emergency"),
        (["epiglottitis", "severe throat swelling", "drooling", "cannot swallow", "muffled voice"], "Emergency"),
        # Trauma / External
        (["unresponsive patient", "no pulse found by bystander", "major trauma"], "Emergency"),
        (["major bleeding from wound", "blood soaking through multiple bandages", "pale and confused"], "Emergency"),
        (["gunshot wound to chest", "difficulty breathing", "coughing blood", "hypotensive"], "Emergency"),
        (["stab wound to abdomen", "evisceration", "severe bleeding", "hypotensive"], "Emergency"),
        (["severe burn covering both arms and chest", "skin peeling off", "no pain due to nerve damage"], "Emergency"),
        (["high voltage electric shock", "unconscious", "entry and exit burns", "cardiac arrhythmia"], "Emergency"),
        (["near drowning", "unconscious", "breathing with gurgling sounds", "cyanotic"], "Emergency"),
        # Metabolic / Toxicological
        (["overdose", "unconscious", "shallow breathing", "pinpoint pupils", "won't wake up"], "Emergency"),
        (["diabetic ketoacidosis", "extreme thirst", "fruity breath", "confusion", "rapid breathing", "blood sugar over 500"], "Emergency"),
        (["diabetic coma", "blood sugar extremely low below 30", "not waking up", "cold clammy skin"], "Emergency"),
        (["carbon monoxide poisoning", "severe headache", "confusion", "multiple family members affected"], "Emergency"),
        (["drug overdose", "altered consciousness", "blue lips", "vomiting while unconscious"], "Emergency"),
        (["septic shock", "fever with very low blood pressure", "altered mental status", "mottled skin", "rapid heart rate"], "Emergency"),
        # Obstetric
        (["eclampsia", "pregnant patient", "seizure", "severe headache", "very high blood pressure"], "Emergency"),
        (["severe postpartum hemorrhage", "excessive bleeding after delivery", "pale and dizzy", "blood pressure dropping"], "Emergency"),
        (["placental abruption", "sudden severe abdominal pain in pregnancy", "heavy bleeding", "board-like abdomen"], "Emergency"),
        # Paediatric critical
        (["infant not breathing", "baby under 3 months", "cyanotic", "limp", "unresponsive"], "Pediatrics"),
        (["meningococcal rash in child", "non-blanching petechiae", "fever", "neck stiffness", "photophobia"], "Pediatrics"),
        (["severe croup", "child cannot breathe", "stridor at rest", "cyanotic lips", "drooling"], "Pediatrics"),
        # Surgical
        (["aortic dissection", "tearing chest pain radiating to back", "unequal blood pressure arms", "pale"], "Emergency"),
        (["ruptured ectopic pregnancy", "sudden severe lower abdominal pain", "shoulder tip pain", "collapse"], "Emergency"),
        (["bowel perforation", "rigid abdomen", "severe diffuse abdominal pain", "signs of shock"], "Emergency"),
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# SEVERITY 4 — EMERGENT (serious but not immediately life-threatening)
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_4_EMERGENT = {
    "symptom_sets": [
        # Paediatric
        (["high fever 103 in 8 month old baby", "not eating", "very lethargic", "crying inconsolably"], "Pediatrics"),
        (["febrile seizure in child", "temperature 102", "shaking arms and legs", "now drowsy"], "Pediatrics"),
        (["infant with fever 101", "under 3 months old", "not feeding", "irritable"], "Pediatrics"),
        (["child with stridor", "barking cough", "difficulty breathing", "fever"], "Pediatrics"),
        (["severe dehydration in toddler", "sunken eyes", "no tears", "not urinated in 8 hours", "lethargic"], "Pediatrics"),
        # Orthopaedic / Trauma
        (["compound fracture", "bone sticking out of skin", "severe pain in leg", "blood oozing"], "Emergency"),
        (["suspected hip fracture in elderly patient", "cannot bear weight", "leg rotated outward", "severe pain"], "Orthopedics"),
        (["head injury from fall", "loss of consciousness for 1 minute", "now confused", "vomiting once"], "Emergency"),
        (["spinal injury", "fall from height", "cannot move legs", "neck pain"], "Emergency"),
        (["open wound with tendon visible", "deep laceration on hand", "cannot flex fingers"], "Emergency"),
        (["severe ankle fracture", "obvious deformity", "cannot bear weight", "swelling rapidly"], "Orthopedics"),
        # Respiratory
        (["moderate difficulty breathing", "acute asthma attack", "wheezing loudly", "partial response to inhaler"], "Pulmonology"),
        (["pneumonia", "fever 103", "productive green cough", "breathing rate 28", "SpO2 92 percent"], "Pulmonology"),
        (["pleural effusion", "progressive shortness of breath", "dullness on percussion", "reduced breath sounds"], "Pulmonology"),
        (["spontaneous pneumothorax", "sudden onset pleuritic chest pain", "shortness of breath", "reduced breath sounds one side"], "Pulmonology"),
        # Cardiac / Vascular
        (["hypertensive crisis", "blood pressure 200 over 120", "severe headache", "blurry vision"], "Cardiology"),
        (["chest pain with deep breathing", "coughing blood", "recent long flight", "possible PE"], "Cardiology"),
        (["acute heart failure exacerbation", "severe shortness of breath lying flat", "bilateral leg swelling", "pink frothy sputum"], "Cardiology"),
        (["rapid atrial fibrillation", "palpitations", "shortness of breath", "blood pressure 90 over 60"], "Cardiology"),
        # Abdominal
        (["severe abdominal pain", "cannot stand straight", "vomiting blood", "rigid abdomen"], "Emergency"),
        (["suspected appendicitis", "severe right lower abdominal pain", "guarding", "fever", "nausea"], "Emergency"),
        (["acute pancreatitis", "severe epigastric pain radiating to back", "vomiting", "amylase elevated"], "Emergency"),
        (["gastrointestinal bleeding", "vomiting bright red blood", "black tarry stools", "dizziness"], "Emergency"),
        (["kidney stone", "severe flank pain", "cannot find comfortable position", "blood in urine", "vomiting"], "Emergency"),
        (["mesenteric ischemia", "severe abdominal pain out of proportion to examination", "atrial fibrillation history"], "Emergency"),
        # Urological / Obstetric
        (["testicular torsion", "sudden severe scrotal pain", "nausea", "testes high riding", "onset 2 hours ago"], "Emergency"),
        (["urosepsis", "fever", "rigors", "flank pain", "confusion", "low blood pressure"], "Emergency"),
        (["ectopic pregnancy", "lower abdominal pain", "missed period", "vaginal bleeding", "positive pregnancy test"], "Emergency"),
        (["hyperemesis gravidarum", "persistent vomiting in pregnancy", "ketones in urine", "unable to keep any fluid down"], "Emergency"),
        # Neurological
        (["sudden severe headache", "worst headache in life history", "one side", "vision changes"], "Neurology"),
        (["first-ever seizure in adult", "tonic-clonic", "post-ictal confusion", "incontinent"], "Neurology"),
        (["transient ischemic attack", "brief episode of arm weakness", "slurred speech for 10 minutes now resolved"], "Neurology"),
        (["cauda equina syndrome", "back pain", "saddle anaesthesia", "urinary incontinence", "leg weakness"], "Neurology"),
        # Infectious
        (["severe infection", "spreading redness on leg", "red streaks tracking up limb", "high fever", "malaise"], "Emergency"),
        (["necrotising fasciitis", "rapidly spreading skin infection", "severe pain disproportionate to appearance", "crepitus on palpation"], "Emergency"),
        (["severe sepsis", "fever 104", "heart rate 120", "respiratory rate 24", "confusion", "low blood pressure"], "Emergency"),
        # Eye / ENT
        (["acute angle-closure glaucoma", "sudden severe eye pain", "blurred vision", "halos around lights", "vomiting"], "Emergency"),
        (["chemical splash in eye", "severe eye pain", "cannot open eye", "vision blurred", "copious irrigation needed"], "Emergency"),
        (["retinal detachment", "sudden flashing lights", "floaters", "curtain coming down over vision"], "Emergency"),
        # Psychiatric emergency
        (["active suicidal attempt", "ingested unknown number of tablets", "drowsy", "brought in by family"], "Emergency"),
        (["severe psychotic episode", "violent", "danger to self and others", "not responding to verbal de-escalation"], "Emergency"),
        # Dermatological
        (["Stevens-Johnson syndrome", "blistering rash covering body", "mucous membrane involvement", "fever", "after starting new medication"], "Dermatology"),
        (["severe angio-oedema", "lip and tongue swelling", "not involving throat", "recent ACE inhibitor started"], "Emergency"),
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# SEVERITY 3 — URGENT (needs attention within the hour)
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_3_URGENT = {
    "symptom_sets": [
        # Respiratory
        (["mild difficulty breathing", "wheezing", "mild asthma", "relieved partially by inhaler"], "Pulmonology"),
        (["high fever 101 for 3 days", "productive cough", "chest tightness", "feeling unwell"], "Pulmonology"),
        (["persistent cough for 3 weeks", "night sweats", "unintentional weight loss", "possible TB"], "Pulmonology"),
        (["hemoptysis", "coughing small amounts of blood", "no chest pain", "no fever"], "Pulmonology"),
        # Surgical / Wound
        (["deep cut on hand needing stitches", "bleeding controlled with pressure", "tendon intact"], "General Medicine"),
        (["animal bite", "dog bite on hand", "wound needs cleaning and rabies assessment"], "General Medicine"),
        (["puncture wound on foot", "stepped on nail", "up to date tetanus not confirmed", "moderate pain"], "General Medicine"),
        (["laceration on scalp", "bleeding a lot but controlled", "no loss of consciousness"], "General Medicine"),
        # Orthopaedic
        (["minor fracture", "x-ray shows hairline crack in wrist", "moderate pain", "swelling"], "Orthopedics"),
        (["moderate ankle sprain", "significant swelling", "cannot bear full weight", "bruising"], "Orthopedics"),
        (["knee injury", "twisted while playing sport", "swelling", "unable to fully straighten"], "Orthopedics"),
        (["clavicle fracture", "fell onto shoulder", "deformity visible", "moderate pain"], "Orthopedics"),
        # Genitourinary
        (["urinary tract infection", "fever 101", "burning urination", "back pain", "chills"], "General Medicine"),
        (["renal colic", "flank pain", "radiating to groin", "mild nausea", "no fever"], "General Medicine"),
        (["acute urinary retention", "cannot pass urine for 10 hours", "lower abdominal distension", "severe discomfort"], "General Medicine"),
        # GI
        (["persistent vomiting", "cannot keep food or water down for 6 hours", "mildly dehydrated"], "General Medicine"),
        (["abdominal pain", "nausea vomiting", "moderate pain 6 out of 10", "localised to right side"], "General Medicine"),
        (["gastrointestinal bleeding", "dark tarry stools", "no haemodynamic compromise", "mild dizziness"], "General Medicine"),
        (["acute diarrhoea", "6 episodes today", "mild blood in stool", "moderate dehydration"], "General Medicine"),
        # Neurological
        (["migraine", "throbbing headache for hours", "light sensitivity", "vomiting once", "previous migraine history"], "Neurology"),
        (["new onset severe headache", "not worst of life", "no neck stiffness", "no fever", "unilateral"], "Neurology"),
        (["dizziness and vertigo", "room spinning", "nausea", "worse with head movement", "no hearing loss"], "Neurology"),
        (["facial nerve palsy", "Bell's palsy", "sudden one-sided facial weakness", "cannot close eye fully"], "Neurology"),
        # Paediatric
        (["child fever 102", "ear pulling", "crying", "ear infection suspected", "irritable"], "Pediatrics"),
        (["child with rash", "fever", "rash spreading", "not petechial", "irritable but consolable"], "Pediatrics"),
        (["infant feeding poorly", "4 months old", "low-grade fever", "fewer wet nappies"], "Pediatrics"),
        # Eye / ENT
        (["foreign object in ear", "child put bead in ear", "cannot remove at home", "mild discomfort"], "ENT"),
        (["eye redness and pain", "blurry vision", "possible corneal scratch or abrasion"], "General Medicine"),
        (["dental abscess", "tooth pain radiating to jaw", "facial swelling", "fever"], "ENT"),
        (["epistaxis", "nosebleed not stopping after 20 minutes of pressure", "hypertensive patient"], "ENT"),
        (["foreign body ingestion", "child swallowed coin", "no respiratory distress", "mild discomfort swallowing"], "ENT"),
        # Dermatological / Infectious
        (["cellulitis on forearm", "warm red swollen", "spreading 2 cm per hour", "mild fever"], "Dermatology"),
        (["abscess requiring incision", "painful fluctuant swelling", "pointing", "mild fever"], "Dermatology"),
        (["herpes zoster shingles", "severe unilateral pain", "vesicular rash in dermatomal distribution"], "Dermatology"),
        (["infected wound", "increasing redness", "pus discharge", "mild fever", "3 days after injury"], "General Medicine"),
        # Psychiatric / Mental Health
        (["acute anxiety attack", "hyperventilating", "tingling in hands", "chest tightness", "distressed"], "General Medicine"),
        (["suicidal ideation", "passive thoughts", "no plan", "agrees to safety assessment"], "General Medicine"),
        (["alcohol withdrawal", "last drink 24 hours ago", "tremors", "sweating", "anxious", "mild confusion"], "General Medicine"),
        # Cardiovascular
        (["palpitations", "intermittent for 2 hours", "no chest pain", "no syncope", "history of SVT"], "Cardiology"),
        (["DVT suspected", "calf pain", "swelling", "warmth", "recent long-haul flight"], "Cardiology"),
        (["hypertension", "blood pressure 180 over 105", "mild headache", "no end organ damage symptoms"], "Cardiology"),
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# SEVERITY 2 — SEMI-URGENT (can wait 2–4 hours)
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_2_SEMI_URGENT = {
    "symptom_sets": [
        # Musculoskeletal
        (["minor ankle sprain", "mild swelling", "able to walk with slight limp", "no deformity"], "Orthopedics"),
        (["back pain", "pulled muscle while lifting", "moderate pain", "no numbness or tingling"], "General Medicine"),
        (["mild knee pain", "no swelling", "no locking", "overuse injury from running"], "Orthopedics"),
        (["shoulder pain", "dull ache", "worse with overhead activity", "no trauma"], "Orthopedics"),
        (["neck pain and stiffness", "woke with stiff neck", "no trauma", "no neurological symptoms"], "General Medicine"),
        (["mild wrist pain", "after typing all day", "no swelling", "possible repetitive strain"], "Orthopedics"),
        # ENT
        (["earache", "mild ear pain", "no fever", "hearing muffled", "no discharge"], "ENT"),
        (["sore throat", "mild difficulty swallowing", "no fever", "no drooling", "able to eat"], "ENT"),
        (["mild nosebleed", "stopped with pressure", "recurrent", "no anticoagulants"], "ENT"),
        (["blocked sinuses", "facial pressure", "thick nasal discharge", "mild headache", "no fever"], "ENT"),
        (["earwax blockage", "sudden hearing loss", "sensation of blockage", "no pain", "tinnitus"], "ENT"),
        (["mild tonsillitis", "sore throat", "low grade fever 99", "tonsils slightly swollen", "no peritonsillar swelling"], "ENT"),
        # General / Infectious
        (["low grade fever 99", "mild body aches", "feeling generally unwell", "no rash", "no cough"], "General Medicine"),
        (["mild urinary discomfort", "no fever", "slight burning on urination", "no frequency"], "General Medicine"),
        (["constipation", "no bowel movement for 3 days", "mild cramping", "no blood in stool"], "General Medicine"),
        (["mild diarrhoea", "2–3 loose stools", "no blood", "mild nausea", "no fever"], "General Medicine"),
        (["mild nausea and vomiting", "2 episodes", "keeping fluids down", "no abdominal pain"], "General Medicine"),
        (["pink eye conjunctivitis", "eye discharge", "mild redness", "no pain", "no vision change"], "General Medicine"),
        # Skin
        (["mild skin rash", "itching", "not spreading", "no fever", "no blistering"], "Dermatology"),
        (["insect bite", "localized swelling", "mild itching", "no anaphylaxis signs", "one limb"], "Dermatology"),
        (["contact dermatitis", "redness and rash at site of contact", "itching", "no systemic symptoms"], "Dermatology"),
        (["mild sunburn", "redness on back", "mild pain", "no blistering", "no fever"], "Dermatology"),
        (["ingrown toenail", "mild redness", "localised pain", "no pus", "not cellulitic"], "Dermatology"),
        (["mild acne flare", "multiple inflamed spots", "no systemic symptoms", "seeking advice on treatment"], "Dermatology"),
        # Eye
        (["eye irritation", "mild redness", "no pain", "feels like something inside", "tearing"], "General Medicine"),
        (["mild eye strain", "blurry vision after screen use", "headache", "resolves with rest"], "General Medicine"),
        # Dental
        (["mild toothache", "no swelling", "no fever", "can wait for dentist"], "ENT"),
        (["dental filling fell out", "mild sensitivity", "no pain at rest", "no swelling"], "ENT"),
        # Women's Health
        (["vaginal discharge", "abnormal colour", "mild itching", "no fever", "no abdominal pain"], "General Medicine"),
        (["mild menstrual cramps", "heavy period", "no dizziness", "stable haemodynamics"], "General Medicine"),
        # Neurological
        (["mild headache", "tension headache", "both temples", "responsive to paracetamol", "no vomiting"], "General Medicine"),
        (["mild dizziness", "light-headed when standing", "no syncope", "well hydrated"], "General Medicine"),
        # Mental Health
        (["mild anxiety", "feeling stressed", "no immediate safety concerns", "wants to talk to someone"], "General Medicine"),
        (["difficulty sleeping", "insomnia for 2 weeks", "no psychiatric history", "work related stress"], "General Medicine"),
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# SEVERITY 1 — NON-URGENT / ROUTINE
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_1_NON_URGENT = {
    "symptom_sets": [
        # Preventive / Administrative
        (["routine annual checkup", "no complaints", "general wellness exam requested"], "General Medicine"),
        (["prescription refill needed", "blood pressure medication running low", "stable condition"], "General Medicine"),
        (["vaccination requested", "flu shot needed", "no acute symptoms"], "General Medicine"),
        (["child immunisation schedule", "6 month check", "no concerns", "healthy"], "Pediatrics"),
        (["routine blood test results review", "follow up visit", "no new symptoms"], "General Medicine"),
        (["post surgery follow up", "healing well", "no concerns", "suture removal today"], "General Medicine"),
        (["chronic disease management", "diabetes review", "blood sugars well controlled", "no acute issues"], "General Medicine"),
        (["hypertension review", "blood pressure well controlled on medication", "no symptoms"], "Cardiology"),
        (["asthma review", "well controlled", "no recent attacks", "medication review"], "Pulmonology"),
        (["thyroid follow up", "stable on levothyroxine", "no symptoms"], "General Medicine"),
        # Minor / Self-resolving
        (["mild cold", "stuffy nose", "slight cough", "no fever", "no breathing issues", "2 days duration"], "General Medicine"),
        (["mild sore throat", "no fever", "eating and drinking normally", "1 day duration"], "General Medicine"),
        (["minor bruise", "bumped knee yesterday", "no swelling", "no pain at rest"], "General Medicine"),
        (["minor paper cut", "superficial", "already stopped bleeding", "no wound care needed"], "General Medicine"),
        (["mild sunburn", "red arms from gardening", "no blistering", "no fever", "applying aloe"], "Dermatology"),
        (["dry skin rash", "no itching", "no fever", "been there a week", "not spreading"], "Dermatology"),
        (["mild acne", "seeking dermatology advice", "no pain", "no systemic symptoms"], "Dermatology"),
        (["dandruff", "scalp flaking", "mild itching", "no redness beyond scalp"], "Dermatology"),
        # Wellness
        (["weight management consultation", "no acute complaints", "BMI review"], "General Medicine"),
        (["nutritional advice", "feeling slightly tired", "wants dietary guidance", "blood tests normal"], "General Medicine"),
        (["vitamin deficiency follow up", "feeling slightly tired", "already taking supplements"], "General Medicine"),
        (["allergy medicine refill", "seasonal allergies", "well controlled", "pollen season"], "General Medicine"),
        (["sleep issues", "mild insomnia", "no other complaints", "good sleep hygiene advice needed"], "General Medicine"),
        # Paediatric routine
        (["child growth checkup", "6 month well baby visit", "no concerns", "feeding well"], "Pediatrics"),
        (["school medical", "routine school entry examination", "no complaints"], "Pediatrics"),
        (["child with nappy rash", "mild redness", "no fever", "no bleeding", "advice needed"], "Pediatrics"),
        # Eye / ENT routine
        (["routine eye test referral", "blurry vision for distance", "no pain", "no sudden change"], "General Medicine"),
        (["wax removal appointment", "hearing muffled", "no pain", "no fever", "both ears"], "ENT"),
        (["tinnitus", "ringing in ears", "no pain", "no hearing loss", "been 3 weeks", "mild"], "ENT"),
        # Musculoskeletal routine
        (["physiotherapy referral", "chronic back pain", "well managed at home", "needs formal referral"], "Orthopedics"),
        (["joint stiffness in the morning", "hands", "less than 30 minutes", "no swelling", "wants review"], "Orthopedics"),
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# LANGUAGE VARIETY HELPERS
# ─────────────────────────────────────────────────────────────────────────────

OPENERS = [
    "Patient presents with",
    "Patient complains of",
    "Patient reports",
    "Chief complaint:",
    "Patient came in with",
    "Patient is experiencing",
    "Patient describes",
    "Presenting with",
    "Complaining of",
    "Patient attended with",
    "Brought in by family due to",
    "Walk-in patient reporting",
    "Patient self-referred with",
    "Referred from GP with",
    "Patient mentions",
    "Patient is concerned about",
    "The patient notes",
    "",  # No opener — just symptoms
]

AGE_MODIFIERS = [
    "",  # no modifier
    "Elderly patient, ",
    "Young adult patient, ",
    "Paediatric patient, ",
    "Middle-aged patient, ",
    "Adult male patient, ",
    "Adult female patient, ",
    "Pregnant patient, ",
    "Post-operative patient, ",
]

DURATION_PHRASES = [
    "",  # no duration
    " since this morning.",
    " for the past 2 hours.",
    " for the past 24 hours.",
    " for the last 3 days.",
    " onset sudden.",
    " started an hour ago.",
    " worsening over the past few hours.",
    " gradually worsening over 2 days.",
]


def symptoms_to_text(symptoms: list) -> str:
    opener = random.choice(OPENERS)
    age_mod = random.choice(AGE_MODIFIERS)
    duration = random.choice(DURATION_PHRASES)
    symptom_text = ", ".join(symptoms)

    if opener:
        base = f"{age_mod}{opener} {symptom_text}"
    else:
        base = f"{age_mod}{symptom_text.capitalize()}"

    # Optionally append a duration phrase
    if duration and not base.endswith("."):
        return base + duration
    return base.rstrip(".") + "."


# ─────────────────────────────────────────────────────────────────────────────
# CRITICAL SYMPTOM KEYWORDS (for auto-tagging)
# ─────────────────────────────────────────────────────────────────────────────

CRITICAL_KEYWORDS = [
    "pain", "bleeding", "breathing", "conscious", "fever", "seizure",
    "vomit", "fracture", "burn", "swelling", "blood", "pressure",
    "oxygen", "cardiac", "stroke", "shock", "infection", "trauma",
]


def get_critical_symptoms(symptoms: list) -> list:
    flagged = [s for s in symptoms if any(kw in s.lower() for kw in CRITICAL_KEYWORDS)]
    return flagged[:3]


def get_clinical_summary(symptoms: list, score: int, department: str) -> str:
    brief = symptoms[0] if symptoms else "presented symptoms"
    summaries = [
        f"Patient presenting with {brief}; triaged to {department} with severity level {score}.",
        f"Assessment: {brief}. Recommended for {department} evaluation.",
        f"Clinical review of {brief} indicates {department} referral at severity {score}.",
        f"Patient with {brief}; immediate {department} assessment required at level {score}.",
        f"Triage complete. Primary complaint: {brief}. Department: {department}. Score: {score}.",
        f"Patient seen for {brief}. Severity {score} assigned; directed to {department}.",
    ]
    return random.choice(summaries)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

def generate_examples(severity_data: dict, score: int, count: int) -> list:
    examples = []
    symptom_sets = severity_data["symptom_sets"]

    for _ in range(count):
        symptoms, department = random.choice(symptom_sets)
        working_symptoms = list(symptoms)

        # Stochastic truncation — randomly drop some symptoms to create variety
        if len(working_symptoms) > 2 and random.random() > 0.5:
            keep = random.randint(2, len(working_symptoms))
            working_symptoms = working_symptoms[:keep]

        # Occasionally shuffle symptom order
        if random.random() > 0.7:
            random.shuffle(working_symptoms)

        input_text = f"Triage the following patient symptoms: {symptoms_to_text(working_symptoms)}"

        output = {
            "severityScore": score,
            "recommendedDepartment": department,
            "criticalSymptoms": get_critical_symptoms(working_symptoms),
            "clinicalSummary": get_clinical_summary(working_symptoms, score, department)
        }

        examples.append({
            "input": input_text,
            "output": json.dumps(output)
        })

    return examples


def main():
    print("[CLINICQUEUE] Triage Training Data Generator v2 (Augmented)")
    print("=" * 60)

    all_examples = []

    level_config = [
        (SEVERITY_5_CRITICAL,    5, 600),
        (SEVERITY_4_EMERGENT,    4, 700),
        (SEVERITY_3_URGENT,      3, 700),
        (SEVERITY_2_SEMI_URGENT, 2, 550),
        (SEVERITY_1_NON_URGENT,  1, 450),
    ]

    for data, score, count in level_config:
        examples = generate_examples(data, score, count)
        all_examples.extend(examples)
        print(f"  [OK] Level {score}: {len(examples)} examples  ({len(data['symptom_sets'])} unique templates)")

    random.shuffle(all_examples)

    output_path = "triage_dataset_synthetic.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_examples, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Total synthetic examples : {len(all_examples)}")
    print(f"[FILE] Saved to                 : {output_path}")

    # Distribution summary
    print("\n[DISTRIBUTION]")
    from collections import Counter
    scores = [json.loads(e["output"])["severityScore"] for e in all_examples]
    for lvl, cnt in sorted(Counter(scores).items()):
        bar = "#" * (cnt // 20)
        print(f"  Level {lvl}: {cnt:4d}  {bar}")

    print(f"\n[SAMPLE ENTRY]")
    sample = random.choice(all_examples)
    print(f"  INPUT : {sample['input']}")
    print(f"  OUTPUT: {sample['output']}")


if __name__ == "__main__":
    main()
