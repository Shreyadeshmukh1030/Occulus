"""
RetinaAware / VisionCare — Stage 4: Dataset Curator
Samples a balanced, curated subset of approximately 1,200–1,500 unique images
from the quality-filtered candidate images.

Target class quotas:
  - Normal (N): ~300
  - Diabetes (D): ~300
  - Glaucoma (G): ~200
  - Cataract (C): ~200
  - AMD (A): ~200
  - Hypertension (H): ~128 (all available)
  Total target = ~1,328 unique images.

Reproducible using SEED = 42.
"""

import pandas as pd
import numpy as np

def curate_subset(df, seed=42, quotas=None):
    """
    Samples a balanced subset according to designated class quotas.
    """
    if quotas is None:
        quotas = {
            'normal': 300,
            'diabetes': 300,
            'glaucoma': 200,
            'cataract': 200,
            'ageDegeneration': 200,
            'hypertension': 128  # all available valid cases
        }
        
    print(f"[Curator] Selecting curated subset using SEED={seed} and quotas: {quotas}")
    
    curated_dfs = []
    
    for cat, quota in quotas.items():
        cat_df = df[df['category'] == cat]
        available = len(cat_df)
        
        sample_count = min(quota, available)
        print(f"  Category '{cat}': available={available}, sampled={sample_count}")
        
        sampled = cat_df.sample(n=sample_count, random_state=seed)
        curated_dfs.append(sampled)
        
    curated_df = pd.concat(curated_dfs, axis=0).reset_index(drop=True)
    
    print(f"[Curator] Total curated images: {len(curated_df)}")
    return curated_df

if __name__ == "__main__":
    from src.preprocessing.inspect_dataset import inspect_dataset
    from src.preprocessing.label_builder import build_labels
    from src.preprocessing.quality_checker import run_quality_check
    
    raw_df, _ = inspect_dataset()
    labeled_df = build_labels(raw_df)
    filtered_df, _ = run_quality_check(labeled_df)
    curated_df = curate_subset(filtered_df, seed=42)
    print(curated_df['category'].value_counts())
