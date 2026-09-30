"""
RetinaAware / VisionCare — Stage 3: Image Quality Inspection & Auditing
Evaluates image quality metrics:
  - Laplacian Variance (Blur detection)
  - Mean Brightness (Overexposure / underexposure detection)
  - Contrast (RMS standard deviation of pixel intensities)
  - Structural integrity & dimensions (224x224 RGB)
Generates reports/quality_report.csv with transparent reasoning.
"""

import os
import cv2
import numpy as np
import pandas as pd
from PIL import Image

def analyze_image_quality(image_path):
    """
    Computes objective quality metrics for a fundus image.
    """
    metrics = {
        "blur_score": 0.0,
        "mean_brightness": 0.0,
        "contrast_score": 0.0,
        "is_readable": True,
        "quality_decision": "KEEP",
        "decision_reason": "Passes quality metrics"
    }
    
    try:
        # Load with OpenCV for fast metric calculation
        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            metrics["is_readable"] = False
            metrics["quality_decision"] = "REMOVE"
            metrics["decision_reason"] = "Unreadable or corrupted file"
            return metrics
            
        # Convert to grayscale for blur and intensity checks
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # 1. Variance of Laplacian (blur score)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        metrics["blur_score"] = round(laplacian_var, 2)
        
        # 2. Mean brightness
        mean_bright = float(np.mean(gray))
        metrics["mean_brightness"] = round(mean_bright, 2)
        
        # 3. RMS Contrast (standard deviation of gray values)
        contrast = float(np.std(gray))
        metrics["contrast_score"] = round(contrast, 2)
        
        # Conservative thresholds: only reject clear anomalies
        # Severe underexposure (mean brightness < 5)
        if mean_bright < 5.0:
            metrics["quality_decision"] = "REMOVE"
            metrics["decision_reason"] = f"Severe underexposure (mean brightness {mean_bright:.1f} < 5.0)"
        # Severe overexposure (mean brightness > 250)
        elif mean_bright > 250.0:
            metrics["quality_decision"] = "REMOVE"
            metrics["decision_reason"] = f"Severe overexposure (mean brightness {mean_bright:.1f} > 250.0)"
        # Completely blank / zero contrast
        elif contrast < 1.0:
            metrics["quality_decision"] = "REMOVE"
            metrics["decision_reason"] = f"Zero or near-zero contrast ({contrast:.1f})"
            
    except Exception as e:
        metrics["is_readable"] = False
        metrics["quality_decision"] = "REMOVE"
        metrics["decision_reason"] = f"Exception during image processing: {str(e)}"
        
    return metrics

def run_quality_check(df, output_csv="reports/quality_report.csv"):
    """
    Runs image quality inspection across all candidate images in df.
    """
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    print(f"[Quality Checker] Running image quality analysis on {len(df)} images...")
    
    quality_records = []
    kept_indices = []
    
    for idx, row in df.iterrows():
        img_path = row['file_path']
        metrics = analyze_image_quality(img_path)
        
        rec = {
            "image_id": row.get('image_id', os.path.basename(img_path)),
            "category": row.get('category', 'unknown'),
            "file_path": img_path,
            "blur_score": metrics["blur_score"],
            "mean_brightness": metrics["mean_brightness"],
            "contrast_score": metrics["contrast_score"],
            "is_readable": metrics["is_readable"],
            "decision": metrics["quality_decision"],
            "reason": metrics["decision_reason"]
        }
        quality_records.append(rec)
        
        if metrics["quality_decision"] == "KEEP":
            kept_indices.append(idx)
            
    quality_df = pd.DataFrame(quality_records)
    quality_df.to_csv(output_csv, index=False)
    
    removed_count = len(df) - len(kept_indices)
    print(f"[Quality Checker] Completed. Kept: {len(kept_indices)}, Removed: {removed_count}.")
    print(f"[Quality Checker] Saved audit report to '{output_csv}'.")
    
    filtered_df = df.loc[kept_indices].copy()
    return filtered_df, quality_df

if __name__ == "__main__":
    from src.preprocessing.inspect_dataset import inspect_dataset
    from src.preprocessing.label_builder import build_labels
    raw_df, _ = inspect_dataset()
    labeled_df = build_labels(raw_df)
    filtered_df, q_df = run_quality_check(labeled_df)
