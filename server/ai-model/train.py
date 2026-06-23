# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
"""
train.py — Fine-tune flan-t5-base on the ClinicQueue triage dataset
--------------------------------------------------------------------
WHAT THIS DOES:
  1. Loads triage_dataset.json
  2. Deduplicates (removes 52 exact-duplicate inputs found in EDA)
  3. Splits into train (85%) / validation (15%)
  4. Tokenises inputs and outputs for flan-t5-base
  5. Fine-tunes for 5 epochs using the Hugging Face Trainer
  6. Saves the model to ./triage_model/
  7. Runs a quick smoke test on 5 real examples

DEPENDENCIES (install once):
  pip install transformers datasets torch accelerate

MODEL: google/flan-t5-base
  - 250M parameters
  - Pre-trained on 1,800+ NLP tasks by Google
  - We fine-tune the whole model (full fine-tuning, not LoRA)
  - Fits comfortably in 4GB RAM / CPU-only training
"""

import json
import random
import os

print("[TRAIN] Loading dependencies...")
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    DataCollatorForSeq2Seq,
    EarlyStoppingCallback,
)
from datasets import Dataset
import torch

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────

MODEL_NAME    = "google/flan-t5-base"
DATASET_PATH  = "triage_dataset.json"
OUTPUT_DIR    = "./triage_model"
SEED          = 42

MAX_INPUT_LEN  = 256   # tokens  (EDA showed max ~89 — comfortable headroom)
MAX_OUTPUT_LEN = 200   # tokens  (EDA showed max ~106 — comfortable headroom)

TRAIN_SPLIT   = 0.85   # 85% train, 15% validation
EPOCHS        = 5
BATCH_SIZE    = 8
LEARNING_RATE = 3e-4
WEIGHT_DECAY  = 0.01

random.seed(SEED)

print(f"[TRAIN] Device: {'GPU - ' + torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU (no GPU detected)'}")
print(f"[TRAIN] PyTorch version : {torch.__version__}")


# ─────────────────────────────────────────────────────────────
# STEP 1: LOAD & DEDUPLICATE
# ─────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  STEP 1 — Load & Deduplicate")
print(f"{'='*60}")

with open(DATASET_PATH, encoding="utf-8") as f:
    raw_data = json.load(f)

print(f"  Loaded       : {len(raw_data):,} examples")

# Deduplicate on input text (case-insensitive)
seen = set()
deduplicated = []
for entry in raw_data:
    key = entry["input"].strip().lower()
    if key not in seen:
        seen.add(key)
        deduplicated.append(entry)

print(f"  After dedup  : {len(deduplicated):,} examples  (removed {len(raw_data) - len(deduplicated)} duplicates)")


# ─────────────────────────────────────────────────────────────
# STEP 2: TRAIN / VALIDATION SPLIT
# ─────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  STEP 2 — Train / Validation Split")
print(f"{'='*60}")

random.shuffle(deduplicated)
split_idx   = int(len(deduplicated) * TRAIN_SPLIT)
train_data  = deduplicated[:split_idx]
val_data    = deduplicated[split_idx:]

print(f"  Train set    : {len(train_data):,} examples ({TRAIN_SPLIT*100:.0f}%)")
print(f"  Val set      : {len(val_data):,} examples  ({(1-TRAIN_SPLIT)*100:.0f}%)")


# ─────────────────────────────────────────────────────────────
# STEP 3: LOAD MODEL & TOKENIZER
# ─────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  STEP 3 — Load flan-t5-base")
print(f"{'='*60}")

tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
model     = T5ForConditionalGeneration.from_pretrained(MODEL_NAME)

param_count = sum(p.numel() for p in model.parameters())
print(f"  Model        : {MODEL_NAME}")
print(f"  Parameters   : {param_count:,}  ({param_count/1e6:.0f}M)")


# ─────────────────────────────────────────────────────────────
# STEP 4: TOKENISE
# ─────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  STEP 4 — Tokenise Dataset")
print(f"{'='*60}")

def tokenise(batch):
    model_inputs = tokenizer(
        batch["input"],
        max_length=MAX_INPUT_LEN,
        truncation=True,
        padding="max_length",
    )
    labels = tokenizer(
        text_target=batch["output"],
        max_length=MAX_OUTPUT_LEN,
        truncation=True,
        padding="max_length",
    )
    # Replace pad token id in labels with -100 so loss ignores padding
    labels["input_ids"] = [
        [(token if token != tokenizer.pad_token_id else -100) for token in label]
        for label in labels["input_ids"]
    ]
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

train_hf = Dataset.from_list(train_data)
val_hf   = Dataset.from_list(val_data)

train_tokenised = train_hf.map(tokenise, batched=True, batch_size=64, remove_columns=["input", "output"])
val_tokenised   = val_hf.map(tokenise,   batched=True, batch_size=64, remove_columns=["input", "output"])

print(f"  Tokenised train: {len(train_tokenised):,} examples")
print(f"  Tokenised val  : {len(val_tokenised):,} examples")


# ─────────────────────────────────────────────────────────────
# STEP 5: TRAINING ARGUMENTS
# ─────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  STEP 5 — Configure Trainer")
print(f"{'='*60}")

training_args = Seq2SeqTrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    learning_rate=LEARNING_RATE,
    weight_decay=WEIGHT_DECAY,
    warmup_steps=100,
    lr_scheduler_type="cosine",
    predict_with_generate=True,
    generation_max_length=MAX_OUTPUT_LEN,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    logging_steps=50,
    logging_dir=os.path.join(OUTPUT_DIR, "logs"),
    seed=SEED,
    report_to="none",              # no wandb / tensorboard
    fp16=torch.cuda.is_available(), # use float16 only on GPU
)

data_collator = DataCollatorForSeq2Seq(tokenizer, model=model, padding=True)

trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=train_tokenised,
    eval_dataset=val_tokenised,
    tokenizer=tokenizer,
    data_collator=data_collator,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
)

steps_per_epoch = len(train_tokenised) // BATCH_SIZE
total_steps = steps_per_epoch * EPOCHS
print(f"  Epochs          : {EPOCHS}")
print(f"  Batch size      : {BATCH_SIZE}")
print(f"  Learning rate   : {LEARNING_RATE}")
print(f"  Steps / epoch   : {steps_per_epoch:,}")
print(f"  Total steps     : {total_steps:,}")
print(f"  Early stopping  : patience=2 epochs")
print(f"  Best model saved to: {OUTPUT_DIR}")


# ─────────────────────────────────────────────────────────────
# STEP 6: TRAIN
# ─────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  STEP 6 — Training")
print(f"{'='*60}")
print(f"  Starting training... (this may take 15-40 mins on CPU)")
print()

trainer.train()

print(f"\n  [DONE] Training complete!")
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"  Model saved to: {OUTPUT_DIR}")


# ─────────────────────────────────────────────────────────────
# STEP 7: SMOKE TEST — 5 real examples
# ─────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  STEP 7 — Smoke Test (5 examples)")
print(f"{'='*60}")

test_prompts = [
    "Triage the following patient symptoms: Patient presents with severe chest pain, radiating to left arm, sweating, nausea.",
    "Triage the following patient symptoms: Patient complains of mild cold, stuffy nose, no fever.",
    "Triage the following patient symptoms: Patient reports sudden numbness on one side of face, slurred speech, confusion.",
    "Triage the following patient symptoms: Child fever 102, ear pulling, crying, ear infection suspected.",
    "Triage the following patient symptoms: Patient presents with deep cut on hand needing stitches, bleeding controlled.",
]

expected_scores = [5, 1, 5, 3, 3]

model.eval()
correct = 0

for i, (prompt, expected) in enumerate(zip(test_prompts, expected_scores), 1):
    inputs = tokenizer(prompt, return_tensors="pt", max_length=MAX_INPUT_LEN, truncation=True)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=MAX_OUTPUT_LEN)
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    try:
        parsed = json.loads(result)
        score  = parsed.get("severityScore", "?")
        dept   = parsed.get("recommendedDepartment", "?")
        match  = "CORRECT" if score == expected else f"WRONG (expected {expected})"
        if score == expected:
            correct += 1
    except json.JSONDecodeError:
        score  = "?"
        dept   = "?"
        match  = "JSON PARSE ERROR"

    print(f"\n  Test {i}: [{match}]")
    print(f"    Input    : {prompt[50:100]}...")
    print(f"    Score    : {score}  |  Dept: {dept}")
    print(f"    Raw out  : {result[:120]}")

print(f"\n  Smoke test accuracy: {correct}/{len(test_prompts)} ({correct/len(test_prompts)*100:.0f}%)")
print(f"\n{'='*60}")
print(f"  TRAINING PIPELINE COMPLETE")
print(f"  Model location : {os.path.abspath(OUTPUT_DIR)}")
print(f"  Next step      : wrap model in a FastAPI server")
print(f"{'='*60}\n")
