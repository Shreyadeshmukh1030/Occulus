"""
RetinaAware / VisionCare — Master Preprocessing Pipeline
Orchestrates:
  1. Dataset inspection & inventory
  2. Multi-hot label construction [N, D, G, C, A, H] & M/O filtering
  3. Quality inspection & auditing
  4. Curated subset sampling (~1,328 images)
  5. Patient-level / stratified 70/15/15 splitting
  6. Comprehensive reporting & JSON summary generation
"""

import os
import json
import pandas as pd
from datetime import datetime

from src.preprocessing import TARGET_LABELS
from src.preprocessing.inspect_dataset import inspect_dataset
from src.preprocessing.label_builder import build_labels
from src.preprocessing.quality_checker import run_quality_check
from src.preprocessing.dataset_curator import curate_subset
from src.preprocessing.data_splitter import split_dataset

def run_preprocessing_pipeline(data_dir="datasets", seed=42):
    print("=" * 70)
    print("RETINAAWARE / VISIONCARE — PREPROCESSING PIPELINE INITIALIZED")
    print(f"Random Seed: {seed} | Timestamp: {datetime.now().isoformat()}")
    print("=" * 70)
    
    # 1. Dataset Inspection
    print("\n--- STAGE 1: Dataset Inspection & Integrity Verification ---")
    raw_df, duplicates = inspect_dataset(data_dir=data_dir, output_csv="reports/dataset_statistics.csv")
    
    total_images_original = len(raw_df)
    corrupted_images = int((~raw_df['is_valid']).sum())
    
    # 2. Label Construction & M/O Filtering
    print("\n--- STAGE 2: Multi-Hot Label Construction & Excluded Class Removal ---")
    labeled_df = build_labels(raw_df)
    after_label_filtering_count = len(labeled_df)
    
    # 3. Quality Filtering
    print("\n--- STAGE 3: Image Quality Inspection & Non-Destructive Filtering ---")
    filtered_df, quality_df = run_quality_check(labeled_df, output_csv="reports/quality_report.csv")
    after_quality_filtering_count = len(filtered_df)
    
    # 4. Balanced Subset Curation
    print("\n--- STAGE 4: Balanced Subset Curation ---")
    curated_df = curate_subset(filtered_df, seed=seed)
    final_curated_count = len(curated_df)
    
    # 5. Stratified Splitting
    print("\n--- STAGE 5: Patient-Level / Stratified Splitting (70% / 15% / 15%) ---")
    train_df, val_df, test_df = split_dataset(curated_df, seed=seed, output_dir="data/metadata")
    
    # 6. Generate Label Distribution Statistics
    print("\n--- STAGE 6: Generating Reports & Distribution Analysis ---")
    
    dist_records = []
    for split_name, s_df in [('Train', train_df), ('Validation', val_df), ('Test', test_df), ('Full_Curated', curated_df)]:
        for lbl in TARGET_LABELS:
            cnt = int((s_df[lbl] == 1).sum())
            pct = round(100.0 * cnt / len(s_df), 2)
            dist_records.append({
                "split": split_name,
                "label": lbl,
                "count": cnt,
                "percentage": pct
            })
            
    dist_df = pd.DataFrame(dist_records)
    dist_df.to_csv("reports/label_distribution.csv", index=False)
    
    # Combination analysis
    combo_series = curated_df[TARGET_LABELS].apply(
        lambda row: "+".join([lbl for lbl in TARGET_LABELS if row[lbl] == 1]) or "None",
        axis=1
    )
    combo_counts = combo_series.value_counts().to_dict()
    
    disease_sums = curated_df[['D', 'G', 'C', 'A', 'H']].sum(axis=1)
    single_disease_count = int((disease_sums == 1).sum())
    multi_disease_count = int((disease_sums > 1).sum())
    normal_count = int((curated_df['N'] == 1).sum())
    
    summary = {
        "project": "RetinaAware / VisionCare",
        "timestamp": datetime.now().isoformat(),
        "random_seed": seed,
        "target_classes": TARGET_LABELS,
        "original_dataset": {
            "total_images": total_images_original,
            "corrupted_images": corrupted_images,
            "exact_duplicate_hashes": len(duplicates)
        },
        "after_label_filtering": {
            "images_retained": after_label_filtering_count,
            "excluded_m_and_o": total_images_original - after_label_filtering_count
        },
        "after_quality_filtering": {
            "images_retained": after_quality_filtering_count,
            "images_flagged": after_label_filtering_count - after_quality_filtering_count
        },
        "final_curated_subset": {
            "total_unique_images": final_curated_count,
            "total_patients": final_curated_count,
            "normal_images": normal_count,
            "single_disease_images": single_disease_count,
            "multi_disease_images": multi_disease_count
        },
        "splits": {
            "train": {
                "images": len(train_df),
                "patients": int(train_df['patient_id'].nunique()),
                "percentage": round(100.0 * len(train_df) / final_curated_count, 1),
                "labels": {lbl: int((train_df[lbl] == 1).sum()) for lbl in TARGET_LABELS}
            },
            "validation": {
                "images": len(val_df),
                "patients": int(val_df['patient_id'].nunique()),
                "percentage": round(100.0 * len(val_df) / final_curated_count, 1),
                "labels": {lbl: int((val_df[lbl] == 1).sum()) for lbl in TARGET_LABELS}
            },
            "test": {
                "images": len(test_df),
                "patients": int(test_df['patient_id'].nunique()),
                "percentage": round(100.0 * len(test_df) / final_curated_count, 1),
                "labels": {lbl: int((test_df[lbl] == 1).sum()) for lbl in TARGET_LABELS}
            }
        },
        "label_combinations": combo_counts
    }
    
    with open("reports/preprocessing_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
        
    # Generate Markdown Inspection Report
    md_report = f"""# RetinaAware Dataset Inspection & Preprocessing Summary Report

## 1. Original Dataset Inventory
- **Total Images Scanned**: {total_images_original}
- **Corrupted / Unreadable Images**: {corrupted_images}
- **Unique Cryptographic Hashes (SHA-256)**: {total_images_original - len(duplicates)}
- **Cross-Folder Exact Duplicate Hashes**: {len(duplicates)}
- **Excluded Categories (M = Myopia, O = Others)**: {total_images_original - after_label_filtering_count} images removed
- **Candidate Target Disease Images**: {after_label_filtering_count} images

## 2. Image Quality Audit
- **Total Evaluated**: {after_label_filtering_count}
- **Retained**: {after_quality_filtering_count}
- **Removed Due to Extreme Metrics**: {after_label_filtering_count - after_quality_filtering_count}
- **Quality Log**: Available in `reports/quality_report.csv`

## 3. Curated Subset (~1,200–1,500 Target)
- **Total Unique Curated Images**: {final_curated_count}
- **Total Patients**: {final_curated_count}
- **Normal Images (N)**: {normal_count}
- **Single-Disease Images**: {single_disease_count}
- **Multi-Disease Combinations**: {multi_disease_count}

## 4. Train / Validation / Test Splits (70% / 15% / 15%)
| Split | Image Count | Patient Count | Percentage |
| :--- | :--- | :--- | :--- |
| **Train** | {len(train_df)} | {train_df['patient_id'].nunique()} | {round(100.0 * len(train_df) / final_curated_count, 1)}% |
| **Validation** | {len(val_df)} | {val_df['patient_id'].nunique()} | {round(100.0 * len(val_df) / final_curated_count, 1)}% |
| **Test** | {len(test_df)} | {test_df['patient_id'].nunique()} | {round(100.0 * len(test_df) / final_curated_count, 1)}% |
| **Total** | {final_curated_count} | {final_curated_count} | 100.0% |

## 5. Label Distribution Across Splits
| Label | Description | Train | Validation | Test | Total |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **N** | Normal | {(train_df['N'] == 1).sum()} | {(val_df['N'] == 1).sum()} | {(test_df['N'] == 1).sum()} | {(curated_df['N'] == 1).sum()} |
| **D** | Diabetes / DR | {(train_df['D'] == 1).sum()} | {(val_df['D'] == 1).sum()} | {(test_df['D'] == 1).sum()} | {(curated_df['D'] == 1).sum()} |
| **G** | Glaucoma | {(train_df['G'] == 1).sum()} | {(val_df['G'] == 1).sum()} | {(test_df['G'] == 1).sum()} | {(curated_df['G'] == 1).sum()} |
| **C** | Cataract | {(train_df['C'] == 1).sum()} | {(val_df['C'] == 1).sum()} | {(test_df['C'] == 1).sum()} | {(curated_df['C'] == 1).sum()} |
| **A** | AMD | {(train_df['A'] == 1).sum()} | {(val_df['A'] == 1).sum()} | {(test_df['A'] == 1).sum()} | {(curated_df['A'] == 1).sum()} |
| **H** | Hypertension | {(train_df['H'] == 1).sum()} | {(val_df['H'] == 1).sum()} | {(test_df['H'] == 1).sum()} | {(curated_df['H'] == 1).sum()} |

## 6. Multi-Label Combinations in Curated Subset
| Combination | Count |
| :--- | :--- |
"""
    for combo, cnt in sorted(combo_counts.items(), key=lambda x: -x[1]):
        md_report += f"| {combo} | {cnt} |\n"
        
    with open("reports/dataset_inspection_report.md", "w") as f:
        f.write(md_report)
        
    print("\n[Pipeline Complete] Successfully generated metadata and reports!")
    return summary

if __name__ == "__main__":
    run_preprocessing_pipeline()
