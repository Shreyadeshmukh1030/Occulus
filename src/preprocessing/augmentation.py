"""
RetinaAware / VisionCare — Stage 6: PyTorch Dataset & Augmentation Pipeline
Implements:
  - Training augmentation: Horizontal flip, subtle rotation (±10°), modest color jitter.
  - Validation/Test pipeline: Resize + Tensor + ImageNet normalization ONLY (NO augmentation).
  - Multi-label PyTorch Dataset yielding (image_tensor, multi_hot_label_tensor, metadata).
"""

import os
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import pandas as pd
from src.preprocessing import TARGET_LABELS

# Pretrained ConvNeXt / ImageNet normalization constants
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def get_train_transforms(image_size=(224, 224)):
    """
    Careful augmentation pipeline for retinal fundus images:
    - Random horizontal flip (retina is horizontally symmetric)
    - Small rotation (±10°) to account for head tilt without distorting anatomy
    - Subtle brightness and contrast variations
    - Tensor conversion & ImageNet normalization
    """
    return transforms.Compose([
        transforms.Resize(image_size),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])

def get_val_test_transforms(image_size=(224, 224)):
    """
    Strict validation and test pipeline:
    NO random augmentation. Deterministic evaluation only.
    """
    return transforms.Compose([
        transforms.Resize(image_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])

class RetinaDataset(Dataset):
    """
    Multi-label PyTorch Dataset for RetinaAware fundus images.
    """
    def __init__(self, csv_file, transform=None):
        self.df = pd.read_csv(csv_file) if isinstance(csv_file, str) else csv_file
        self.transform = transform
        self.target_labels = TARGET_LABELS

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row['image_path']
        
        # Load image in RGB
        with Image.open(img_path) as img:
            image = img.convert('RGB')
            
        if self.transform is not None:
            image = self.transform(image)
            
        # 6-dimensional multi-hot float vector for BCE / Asymmetric Loss
        label_vals = [float(row[lbl]) for lbl in self.target_labels]
        labels = torch.tensor(label_vals, dtype=torch.float32)
        
        metadata = {
            'image_id': row['image_id'],
            'patient_id': row['patient_id'],
            'eye_side': row['eye_side'],
            'image_path': img_path
        }
        
        return image, labels, metadata

def get_dataloaders(train_csv="data/metadata/train.csv",
                    val_csv="data/metadata/val.csv",
                    test_csv="data/metadata/test.csv",
                    batch_size=32,
                    num_workers=0):
    """
    Utility factory returning DataLoader instances for train, val, and test splits.
    """
    train_dataset = RetinaDataset(train_csv, transform=get_train_transforms())
    val_dataset = RetinaDataset(val_csv, transform=get_val_test_transforms())
    test_dataset = RetinaDataset(test_csv, transform=get_val_test_transforms())
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    
    return train_loader, val_loader, test_loader
