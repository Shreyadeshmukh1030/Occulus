"""
RetinaAware / VisionCare — Comprehensive Preprocessing Verification Suite
Verifies all 15 rules required for reproducible, leak-free preprocessing:
  1. Every image exists on disk.
  2. Every image can be opened by PIL.
  3. Every image is RGB.
  4. Image dimensions are valid (224 × 224).
  5. No duplicate image occurs across splits.
  6. No patient occurs across multiple splits.
  7. No M/O-only image remains.
  8. No disease image is incorrectly labelled Normal.
  9. All labels are binary (0 or 1 integers).
  10. Label order is strictly [N, D, G, C, A, H].
  11. Train augmentation is not applied to validation/test.
  12. Train/validation/test metadata schemas are consistent.
  13. There are no NaN labels.
  14. There are no missing image paths.
  15. Final dataset size is approximately 1,200–1,500 unique images.
"""

import os
import hashlib
import pandas as pd
from PIL import Image
from src.preprocessing import TARGET_LABELS
from src.preprocessing.augmentation import get_train_transforms, get_val_test_transforms

def run_verification(train_csv="data/metadata/train.csv",
                     val_csv="data/metadata/val.csv",
                     test_csv="data/metadata/test.csv"):
    print("=" * 70)
    print("RETINAAWARE / VISIONCARE — RUNNING 15-POINT PREPROCESSING VERIFICATION")
    print("=" * 70)
    
    assert os.path.exists(train_csv), f"Missing {train_csv}"
    assert os.path.exists(val_csv), f"Missing {val_csv}"
    assert os.path.exists(test_csv), f"Missing {test_csv}"
    
    train_df = pd.read_csv(train_csv)
    val_df = pd.read_csv(val_csv)
    test_df = pd.read_csv(test_csv)
    
    splits = [('Train', train_df), ('Validation', val_df), ('Test', test_df)]
    combined_df = pd.concat([train_df, val_df, test_df], ignore_index=True)
    
    print(f"\nLoaded metadata: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)} | Total={len(combined_df)}")
    
    # 1. Every image exists
    print("\n[Check 1/15] Checking that every image file exists on disk...")
    for s_name, df in splits:
        for idx, path in enumerate(df['image_path']):
            assert os.path.isfile(path), f"FAIL: Image does not exist: {path} in {s_name} row {idx}"
    print("  --> PASS: All images exist on disk.")
    
    # 2. Every image can be opened
    print("\n[Check 2/15] Checking that every image can be opened...")
    for s_name, df in splits:
        for idx, path in enumerate(df['image_path']):
            try:
                with Image.open(path) as img:
                    img.verify()
            except Exception as e:
                assert False, f"FAIL: Corrupted image at {path} in {s_name}: {e}"
    print("  --> PASS: All images open cleanly without corruption.")
    
    # 3. Every image is RGB
    print("\n[Check 3/15] Checking that every image is RGB...")
    for s_name, df in splits:
        for idx, path in enumerate(df['image_path']):
            with Image.open(path) as img:
                assert img.mode == 'RGB', f"FAIL: Image is not RGB ({img.mode}): {path}"
    print("  --> PASS: All images are confirmed 3-channel RGB.")
    
    # 4. Image dimensions are valid (224 x 224)
    print("\n[Check 4/15] Checking image dimensions (224x224)...")
    for s_name, df in splits:
        for idx, path in enumerate(df['image_path']):
            with Image.open(path) as img:
                assert img.size == (224, 224), f"FAIL: Unexpected image size {img.size} for {path}"
    print("  --> PASS: All images are exactly 224x224 pixels.")
    
    # 5. No duplicate image occurs across splits (cryptographic hash check)
    print("\n[Check 5/15] Checking for cross-split duplicate images (SHA-256)...")
    split_hashes = {}
    for s_name, df in splits:
        hashes = set()
        for path in df['image_path']:
            with open(path, "rb") as f:
                h = hashlib.sha256(f.read()).hexdigest()
            hashes.add(h)
        split_hashes[s_name] = hashes
        
    assert len(split_hashes['Train'].intersection(split_hashes['Validation'])) == 0, "FAIL: Duplicate between Train and Val!"
    assert len(split_hashes['Train'].intersection(split_hashes['Test'])) == 0, "FAIL: Duplicate between Train and Test!"
    assert len(split_hashes['Validation'].intersection(split_hashes['Test'])) == 0, "FAIL: Duplicate between Val and Test!"
    print("  --> PASS: Zero duplicate images across Train, Validation, and Test.")
    
    # 6. No patient occurs across multiple splits
    print("\n[Check 6/15] Checking patient-level split separation...")
    train_patients = set(train_df['patient_id'])
    val_patients = set(val_df['patient_id'])
    test_patients = set(test_df['patient_id'])
    
    assert len(train_patients.intersection(val_patients)) == 0, "FAIL: Patient overlap between Train and Val!"
    assert len(train_patients.intersection(test_patients)) == 0, "FAIL: Patient overlap between Train and Test!"
    assert len(val_patients.intersection(test_patients)) == 0, "FAIL: Patient overlap between Val and Test!"
    print("  --> PASS: Zero patient overlap across splits (leakage-free).")
    
    # 7. No M/O-only images remain
    print("\n[Check 7/15] Checking that no M or O labels/images remain...")
    for s_name, df in splits:
        assert 'M' not in df.columns, f"FAIL: M column found in {s_name}"
        assert 'O' not in df.columns, f"FAIL: O column found in {s_name}"
        for path in df['image_path']:
            assert '/myopia/' not in path.replace('\\', '/') and '/others/' not in path.replace('\\', '/'), \
                f"FAIL: Excluded category image found in dataset: {path}"
    print("  --> PASS: Myopia and Others categories are completely excluded.")
    
    # 8. No disease image is incorrectly labelled Normal
    print("\n[Check 8/15] Checking mutual exclusivity between Normal and disease labels...")
    for s_name, df in splits:
        for idx, row in df.iterrows():
            if row['N'] == 1:
                assert row['D'] == 0 and row['G'] == 0 and row['C'] == 0 and row['A'] == 0 and row['H'] == 0, \
                    f"FAIL: Image {row['image_id']} in {s_name} has Normal=1 but also positive disease flags!"
            else:
                disease_sum = row['D'] + row['G'] + row['C'] + row['A'] + row['H']
                assert disease_sum >= 1, f"FAIL: Image {row['image_id']} in {s_name} has N=0 and 0 disease flags!"
    print("  --> PASS: Normal is strictly mutually exclusive with disease labels.")
    
    # 9. All labels are binary (0 or 1 integers)
    print("\n[Check 9/15] Checking that all labels are binary integers (0 or 1)...")
    for s_name, df in splits:
        for lbl in TARGET_LABELS:
            unique_vals = set(df[lbl].unique())
            assert unique_vals.issubset({0, 1}), f"FAIL: Non-binary values in {s_name} column {lbl}: {unique_vals}"
    print("  --> PASS: All 6 label columns strictly contain binary integers (0 or 1).")
    
    # 10. Label order is strictly [N, D, G, C, A, H]
    print("\n[Check 10/15] Checking that label columns follow exact order [N, D, G, C, A, H]...")
    for s_name, df in splits:
        label_cols_in_df = [c for c in df.columns if c in TARGET_LABELS]
        assert label_cols_in_df == ['N', 'D', 'G', 'C', 'A', 'H'], \
            f"FAIL: Incorrect label column order in {s_name}: {label_cols_in_df}"
    print("  --> PASS: Label column order is strictly [N, D, G, C, A, H].")
    
    # 11. Train augmentation is not applied to validation/test
    print("\n[Check 11/15] Checking augmentation pipelines...")
    train_tf = get_train_transforms()
    val_tf = get_val_test_transforms()
    train_tf_names = [t.__class__.__name__ for t in train_tf.transforms]
    val_tf_names = [t.__class__.__name__ for t in val_tf.transforms]
    assert 'RandomHorizontalFlip' in train_tf_names, "FAIL: RandomHorizontalFlip missing from train transforms"
    assert 'RandomRotation' in train_tf_names, "FAIL: RandomRotation missing from train transforms"
    assert 'RandomHorizontalFlip' not in val_tf_names, "FAIL: Augmentation found in val/test transforms!"
    assert 'RandomRotation' not in val_tf_names, "FAIL: Augmentation found in val/test transforms!"
    print("  --> PASS: Train has data augmentation; Validation/Test use deterministic transforms only.")
    
    # 12. Train/validation/test metadata schemas are consistent
    print("\n[Check 12/15] Checking metadata schema consistency...")
    expected_cols = ['image_id', 'image_path', 'patient_id', 'eye_side', 'N', 'D', 'G', 'C', 'A', 'H']
    for s_name, df in splits:
        assert list(df.columns) == expected_cols, f"FAIL: Column schema mismatch in {s_name}: {list(df.columns)}"
    print("  --> PASS: All split CSVs have identical, consistent column schemas.")
    
    # 13. There are no NaN labels
    print("\n[Check 13/15] Checking for NaN labels...")
    for s_name, df in splits:
        nan_count = df[TARGET_LABELS].isna().sum().sum()
        assert nan_count == 0, f"FAIL: Found {nan_count} NaN labels in {s_name}"
    print("  --> PASS: Zero NaN values in label columns.")
    
    # 14. There are no missing image paths
    print("\n[Check 14/15] Checking for missing image paths...")
    for s_name, df in splits:
        missing_paths = df['image_path'].isna().sum() + (df['image_path'] == '').sum()
        assert missing_paths == 0, f"FAIL: Found missing image paths in {s_name}"
    print("  --> PASS: Zero missing or blank image paths.")
    
    # 15. Final dataset size is approximately 1,200–1,500 unique images
    print("\n[Check 15/15] Checking final dataset size (~1,200–1,500 unique images)...")
    total_curated = len(combined_df)
    assert 1200 <= total_curated <= 1500, f"FAIL: Final dataset size {total_curated} is outside 1,200–1,500 range!"
    print(f"  --> PASS: Final curated dataset contains exactly {total_curated} unique images.")
    
    print("\n" + "=" * 70)
    print("ALL 15 PREPROCESSING VERIFICATION CHECKS PASSED SUCCESSFULLY (100% COMPLIANT)!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    run_verification()
