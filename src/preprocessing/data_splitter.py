"""
RetinaAware / VisionCare — Stage 5: Stratified Data Splitter
Performs 70% Train / 15% Validation / 15% Test split with stratified label preservation.
Strictly ensures:
  - No patient occurs in multiple splits
  - No duplicate image occurs across splits
  - Clean CSV metadata output (train.csv, val.csv, test.csv)
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from src.preprocessing import TARGET_LABELS

def split_dataset(curated_df, seed=42, output_dir="data/metadata"):
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"[Splitter] Splitting {len(curated_df)} images with 70% Train, 15% Val, 15% Test (SEED={seed})...")
    
    # Stratify by primary disease category to preserve balanced distributions
    train_df, temp_df = train_test_split(
        curated_df,
        test_size=0.30,
        random_state=seed,
        stratify=curated_df['category']
    )
    
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=seed,
        stratify=temp_df['category']
    )
    
    train_df = train_df.copy().reset_index(drop=True)
    val_df = val_df.copy().reset_index(drop=True)
    test_df = test_df.copy().reset_index(drop=True)
    
    # Set relative or absolute image path as image_path column
    for df_split in [train_df, val_df, test_df]:
        df_split['image_path'] = df_split['file_path']
        
    # Desired columns
    cols = ['image_id', 'image_path', 'patient_id', 'eye_side'] + TARGET_LABELS
    
    train_out = train_df[cols]
    val_out = val_df[cols]
    test_out = test_df[cols]
    
    # Verification assertions:
    train_hashes = set(train_df['sha256'])
    val_hashes = set(val_df['sha256'])
    test_hashes = set(test_df['sha256'])
    
    assert len(train_hashes.intersection(val_hashes)) == 0, "ERROR: Image hash overlap between Train and Val!"
    assert len(train_hashes.intersection(test_hashes)) == 0, "ERROR: Image hash overlap between Train and Test!"
    assert len(val_hashes.intersection(test_hashes)) == 0, "ERROR: Image hash overlap between Val and Test!"
    
    train_pats = set(train_df['patient_id'])
    val_pats = set(val_df['patient_id'])
    test_pats = set(test_df['patient_id'])
    
    assert len(train_pats.intersection(val_pats)) == 0, "ERROR: Patient overlap between Train and Val!"
    assert len(train_pats.intersection(test_pats)) == 0, "ERROR: Patient overlap between Train and Test!"
    assert len(val_pats.intersection(test_pats)) == 0, "ERROR: Patient overlap between Val and Test!"
    
    # Save CSVs
    train_csv = os.path.join(output_dir, "train.csv")
    val_csv = os.path.join(output_dir, "val.csv")
    test_csv = os.path.join(output_dir, "test.csv")
    
    train_out.to_csv(train_csv, index=False)
    val_out.to_csv(val_csv, index=False)
    test_out.to_csv(test_csv, index=False)
    
    print(f"[Splitter] Saved metadata:")
    print(f"  Train:      {len(train_out)} images ({len(train_pats)} patients) -> '{train_csv}'")
    print(f"  Validation: {len(val_out)} images ({len(val_pats)} patients) -> '{val_csv}'")
    print(f"  Test:       {len(test_out)} images ({len(test_pats)} patients) -> '{test_csv}'")
    
    return train_out, val_out, test_out

if __name__ == "__main__":
    from src.preprocessing.inspect_dataset import inspect_dataset
    from src.preprocessing.label_builder import build_labels
    from src.preprocessing.quality_checker import run_quality_check
    from src.preprocessing.dataset_curator import curate_subset
    
    raw_df, _ = inspect_dataset()
    labeled_df = build_labels(raw_df)
    filtered_df, _ = run_quality_check(labeled_df)
    curated_df = curate_subset(filtered_df, seed=42)
    split_dataset(curated_df, seed=42)
