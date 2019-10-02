import math
import numpy as np


'''Helper to perform vector operations.'''


Vector = 'np.ndarray[float]'


def dot(v1, v2):
    assert v1.shape == v2.shape
    return np.dot(v1, v2)

def add(v1, v2):
    assert v1.shape == v2.shape
    return np.add(v1, v2)

def sub(v1, v2):
    assert v1.shape == v2.shape
    return np.subtract(v1, v2)

def l2_len(v):
    return math.sqrt(np.dot(v, v))

def normalize(v):
    return v / l2_len(v)

def cosine_similarity_normalized(v1, v2):
    return dot(v1, v2)