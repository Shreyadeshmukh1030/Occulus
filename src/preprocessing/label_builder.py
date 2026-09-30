"""
RetinaAware / VisionCare — Stage 2: Label Builder & M/O Filtering
Maps categories to the 6 target classes:
  N = Normal
  D = Diabetes / Diabetic Retinopathy
  G = Glaucoma
  C = Cataract
  A = Age-Related Macular Degeneration (AMD)
  H = Hypertension / Hypertensive Retinopathy

Excludes M (Myopia) and O (Others).
Ensures Normal is mutually exclusive with target diseases.
Creates multi-hot binary vectors [N, D, G, C, A, H].
"""

import pandas as pd
from src.preprocessing import TARGET_LABELS, LABEL_MAPPING, EXCLUDED_LABELS

def build_labels(inspection_df):
    """
    Takes the raw inspection DataFrame, filters out M/O-only samples,
    and encodes the 6-dimensional multi-hot vector [N, D, G, C, A, H].
    """
    total_before = len(inspection_df)
    
    # 1. Filter out excluded categories (myopia, others)
    valid_df = inspection_df[~inspection_df['category'].isin(EXCLUDED_LABELS)].copy()
    excluded_count = total_before - len(valid_df)
    print(f"[Label Builder] Excluded {excluded_count} images belonging to {EXCLUDED_LABELS}.")
    print(f"[Label Builder] Candidate images remaining for target classes: {len(valid_df)}")
    
    # 2. Assign unique image_id and patient_id
    # Format: {cat_code}_{index:04d}
    cat_codes = {
        'normal': 'N',
        'diabetes': 'D',
        'glaucoma': 'G',
        'cataract': 'C',
        'ageDegeneration': 'A',
        'hypertension': 'H'
    }
    
    image_ids = []
    patient_ids = []
    
    # Track index per category
    cat_counters = {cat: 0 for cat in cat_codes}
    for _, row in valid_df.iterrows():
        cat = row['category']
        cat_counters[cat] += 1
        idx = cat_counters[cat]
        code = cat_codes[cat]
        img_id = f"{code}_{idx:04d}"
        pat_id = f"PAT_{code}_{idx:04d}"
        image_ids.append(img_id)
        patient_ids.append(pat_id)
        
    valid_df['image_id'] = image_ids
    valid_df['patient_id'] = patient_ids
    valid_df['eye_side'] = 'U'  # U for Unknown / unassigned in anonymized folder set
    
    # 3. Create the 6 target binary columns [N, D, G, C, A, H]
    for lbl in TARGET_LABELS:
        valid_df[lbl] = 0
        
    for idx, row in valid_df.iterrows():
        target_code = LABEL_MAPPING[row['category']]
        valid_df.at[idx, target_code] = 1
        
    # Validation checks on labels:
    # Rule: Normal must have N=1 and all disease columns = 0
    # Rule: Diseases must have N=0
    for idx, row in valid_df.iterrows():
        if row['N'] == 1:
            assert row['D'] == 0 and row['G'] == 0 and row['C'] == 0 and row['A'] == 0 and row['H'] == 0, \
                f"Validation error: Normal image has disease flags! {row}"
        else:
            disease_sum = row['D'] + row['G'] + row['C'] + row['A'] + row['H']
            assert disease_sum >= 1, f"Validation error: Non-normal image has 0 target diseases! {row}"
            
    print(f"[Label Builder] Successfully built multi-hot vectors for {len(valid_df)} images.")
    
    return valid_df

if __name__ == "__main__":
    from src.preprocessing.inspect_dataset import inspect_dataset
    raw_df, _ = inspect_dataset()
    labeled_df = build_labels(raw_df)
    print(labeled_df[['image_id', 'category', 'N', 'D', 'G', 'C', 'A', 'H']].head(10))
