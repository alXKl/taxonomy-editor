from typing import List, Set
from itertools import groupby
import numpy as np
import re
from app.logic import vectors as v
from app.logic.word import Word


"""
Load and cleanup data.
:param dir: File path of word embedding
:return: Word embedding model, vocabulary, dimensions
:rtype: list, dict, int
"""
def load_embedding(dir):
    print(f"Loading {dir}...")
    words, voc = load_embedding_raw(dir)
    print(f"Loaded {len(words)} words.")
    num_dimensions = most_common_dimension(words)
    words = [w for w in words if len(w.vector) == num_dimensions]
    print(f"Using {num_dimensions}-dimensional vectors, {len(words)} remain.")
    # words = remove_stop_words(words)
    # print(f"Removed stop words, {len(words)} remain.")
    # words = remove_duplicates(words)
    # print(f"Removed duplicates, {len(words)} remain.")
    return words, voc, num_dimensions


"""
Read data file and load embedding.
:param dir: File path of word embedding
:return: Word embedding model, vocabulary
:rtype: list, dict
"""
def load_embedding_raw(file_path):
    def parse_line(line, frequency):
        tokens = line.split()
        word = tokens[0]
        vector = v.normalize(np.array([float(x) for x in tokens[1:]]))  # with normalization
        # vector = np.array([float(x) for x in tokens[1:]])
        return Word(word, vector, frequency)
    words = []
    voc = {}
    i = 0
    # Words are sorted from the most common to the least common ones
    frequency = 1
    with open(file_path, encoding="utf8") as f:
        for line in f:
            w = parse_line(line, frequency)
            words.append(w)
            frequency += 1
            voc[i] = w.text
            i+=1
    return words, voc

def iter_len(iter):
    return sum(1 for _ in iter)


"""
In case of not all vectors having same dimesionality, most common one is tracked.
:param words: Word embedding model
:return: Most common dimensionality
:rtype: int
"""
def most_common_dimension(words):
    lengths = sorted([len(word.vector) for word in words])
    dimensions = [(k, iter_len(v)) for k, v in groupby(lengths)]
    for (dim, num_vectors) in dimensions:
        print(f"{num_vectors} {dim}-dimensional vectors")
    most_common = sorted(dimensions, key=lambda t: t[1], reverse=True)[0]
    return most_common[0]


'''U.S -> US'''
ignore_char_regex = re.compile("[\W_]")


'''Word has to start and end with an alphanumeric character.'''
is_valid_word = re.compile("^[^\W_].*[^\W_]$")


"""
Removes duplicate words from embedding.
:param words: Word embedding model
:return: Word embedding model without duplicate words
:rtype: list
"""
def remove_duplicates(words):
    seen_words: Set[str] = set()
    unique_words: List[Word] = []
    for w in words:
        canonical = ignore_char_regex.sub("", w.text)
        if not canonical in seen_words:
            seen_words.add(canonical)
            # Keep the original ordering
            unique_words.append(w)
    return unique_words


"""
Removes stop words from embedding.
:param words: Word embedding model
:return: Word embedding model without stop words
:rtype: list
"""
def remove_stop_words(words):
    return [w for w in words if (
        len(w.text) > 1 and is_valid_word.match(w.text))]


# # Run "smoke tests" on import
# assert [w.text for w in remove_stop_words([
#     Word('a', [], 1),
#     Word('ab', [], 1),
#     Word('-ab', [], 1),
#     Word('ab_', [], 1),
#     Word('a.', [], 1),
#     Word('.a', [], 1),
#     Word('ab', [], 1),
# ])] == ['ab', 'ab']
# assert [w.text for w in remove_duplicates([
#     Word('a.b', [], 1),
#     Word('-a-b', [], 1),
#     Word('ab_+', [], 1),
#     Word('.abc...', [], 1),
# ])] == ['a.b', '.abc...']