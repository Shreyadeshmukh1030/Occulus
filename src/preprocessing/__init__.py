"""
RetinaAware / VisionCare Preprocessing Package
Multi-Label Retinal Disease Classification (N, D, G, C, A, H)
"""

TARGET_LABELS = ['N', 'D', 'G', 'C', 'A', 'H']

LABEL_MAPPING = {
    'normal': 'N',
    'diabetes': 'D',
    'glaucoma': 'G',
    'cataract': 'C',
    'ageDegeneration': 'A',
    'hypertension': 'H'
}

EXCLUDED_LABELS = ['myopia', 'others']
