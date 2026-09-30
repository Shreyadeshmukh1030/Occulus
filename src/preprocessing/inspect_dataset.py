"""
RetinaAware / VisionCare — Stage 1: Dataset Inspection and Inventory
Scans the dataset directory, analyzes image properties, checks integrity,
computes SHA-256 cryptographic hashes, and generates initial statistics.
"""

import os
import glob
import hashlib
from collections import defaultdict
import pandas as pd
from PIL import Image

def inspect_dataset(data_dir="datasets", output_csv="reports/dataset_statistics.csv"):
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    
    records = []
    hash_map = defaultdict(list)
    corrupted_count = 0
    
    categories = sorted([
        d for d in os.listdir(data_dir) 
        if os.path.isdir(os.path.join(data_dir, d))
    ])
    
    print(f"[Inspection] Scanning categories in '{data_dir}': {categories}")
    
    for cat in categories:
        cat_path = os.path.join(data_dir, cat)
        image_files = glob.glob(os.path.join(cat_path, "*.png")) + glob.glob(os.path.join(cat_path, "*.jpg"))
        print(f"  Category '{cat}': found {len(image_files)} image files.")
        
        for img_path in image_files:
            filename = os.path.basename(img_path)
            file_size = os.path.getsize(img_path)
            
            # Compute SHA-256 hash
            hasher = hashlib.sha256()
            with open(img_path, "rb") as f:
                content = f.read()
                hasher.update(content)
            sha256_hash = hasher.hexdigest()
            
            # Check image integrity and dimensions
            is_valid = True
            width, height, mode = None, None, None
            try:
                with Image.open(img_path) as img:
                    width, height = img.size
                    mode = img.mode
            except Exception as e:
                is_valid = False
                corrupted_count += 1
                print(f"  [WARNING] Corrupted image: {img_path} ({e})")
                
            record = {
                "category": cat,
                "filename": filename,
                "file_path": os.path.abspath(img_path).replace("\\", "/"),
                "file_size_bytes": file_size,
                "sha256": sha256_hash,
                "width": width,
                "height": height,
                "mode": mode,
                "is_valid": is_valid
            }
            records.append(record)
            hash_map[sha256_hash].append((cat, filename))
            
    df = pd.DataFrame(records)
    df.to_csv(output_csv, index=False)
    print(f"[Inspection] Total images cataloged: {len(df)}")
    print(f"[Inspection] Corrupted images found: {corrupted_count}")
    print(f"[Inspection] Unique hashes: {len(hash_map)}")
    
    # Check for duplicate hashes
    duplicates = {h: flist for h, flist in hash_map.items() if len(flist) > 1}
    print(f"[Inspection] Cross-file exact duplicates: {len(duplicates)}")
    
    return df, duplicates

if __name__ == "__main__":
    inspect_dataset()
