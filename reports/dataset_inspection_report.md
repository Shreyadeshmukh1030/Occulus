# RetinaAware Dataset Inspection & Preprocessing Summary Report

## 1. Original Dataset Inventory
- **Total Images Scanned**: 6392
- **Corrupted / Unreadable Images**: 0
- **Unique Cryptographic Hashes (SHA-256)**: 6392
- **Cross-Folder Exact Duplicate Hashes**: 0
- **Excluded Categories (M = Myopia, O = Others)**: 940 images removed
- **Candidate Target Disease Images**: 5452 images

## 2. Image Quality Audit
- **Total Evaluated**: 5452
- **Retained**: 5451
- **Removed Due to Extreme Metrics**: 1
- **Quality Log**: Available in `reports/quality_report.csv`

## 3. Curated Subset (~1,200–1,500 Target)
- **Total Unique Curated Images**: 1328
- **Total Patients**: 1328
- **Normal Images (N)**: 300
- **Single-Disease Images**: 1028
- **Multi-Disease Combinations**: 0

## 4. Train / Validation / Test Splits (70% / 15% / 15%)
| Split | Image Count | Patient Count | Percentage |
| :--- | :--- | :--- | :--- |
| **Train** | 929 | 929 | 70.0% |
| **Validation** | 199 | 199 | 15.0% |
| **Test** | 200 | 200 | 15.1% |
| **Total** | 1328 | 1328 | 100.0% |

## 5. Label Distribution Across Splits
| Label | Description | Train | Validation | Test | Total |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **N** | Normal | 210 | 45 | 45 | 300 |
| **D** | Diabetes / DR | 210 | 45 | 45 | 300 |
| **G** | Glaucoma | 140 | 30 | 30 | 200 |
| **C** | Cataract | 140 | 30 | 30 | 200 |
| **A** | AMD | 140 | 30 | 30 | 200 |
| **H** | Hypertension | 89 | 19 | 20 | 128 |

## 6. Multi-Label Combinations in Curated Subset
| Combination | Count |
| :--- | :--- |
| N | 300 |
| D | 300 |
| G | 200 |
| C | 200 |
| A | 200 |
| H | 128 |
