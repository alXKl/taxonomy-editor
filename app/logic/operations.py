from app.logic import vectors as v, learning as lrn, load as l
import numpy as np
import time
import nmslib
import random
import json


'''
This is the logic interface for all
services provided by flask view functions.
'''


'''Word-embedding, vocabulary, dimensions, index, training data-container'''
words, voc, dims, index = None, None, None, None
trainData = {}


'''
Loads embedding and initializes words with respective vectors,
builds vocabulary of all words and chooses respective dimension.
:param dir: Word embedding that should be loaded
'''
def load_embedding(dir):
    global words, voc, dims
    words, voc, dims = l.load_embedding(dir)
    lrn.reset_matrices(dims)


'''
Loads existing index of default german, or english embedding.
:param dir: Index that should be loaded
'''
def load_index(dir):
    start = time.time()
    global index
    index = nmslib.init(method='hnsw', space='cosinesimil', data_type=nmslib.DataType.DENSE_VECTOR)
    index.loadIndex(dir)
    print(time.time() - start)


'''
Creates index for custom embedding with hnsw mode and cosine similarity.
'''
def create_index():
    start = time.time()
    global index
    index = nmslib.init(method='hnsw', space='cosinesimil', data_type=nmslib.DataType.DENSE_VECTOR)
    i = 0
    for w in words:
        index.addDataPoint(i, w.vector)
        i += 1
    index.createIndex({}, print_progress=True)
    print(time.time() - start)


'''
Saves index of custom embedding.
:param dir: Directory of saved index
'''
def save_idex(dir):
    start = time.time()
    index.saveIndex(dir)
    print(time.time() - start)


'''
A random word is chosen from vucabulary, as long it doesn't already exists in graph.
:param terms: Words that are currently present in the graph
:return term: Word that is randomly found
:rtype: str
'''
def get_random_term(terms):
    while True:
        term = voc.get(random.randint(0,len(voc)-1))
        # if term[0].isupper() and term not in terms:
        # term = re.sub('[^A-Za-z0-9]+', '', term)
        if term not in terms:
            return term


'''
Based on existing terms in graph, an average is calculated and most similar words are returned.
:param terms: Words that are currently present in the graph
:return term: Word for the average of all vectors
:rtype: str
'''
def get_avg_term(terms):
    avg = np.zeros(dims)
    for t in terms:
        base_word = find_word(t)
        base_vector = base_word.vector
        avg += base_vector
    avg /= len(terms)
    result = most_similar(avg, 10)
    for k,v in result:
        if k[0].isupper() and k not in terms:
            return k
    return ''


'''
Checks whether a word exists in vocabulary.
:param term: Word that is checked for existence
:return: Whether word exists or not
:rtype: bool
'''
def term_exists(term):
    return term in voc.values()


'''
Returns a term, if it exists in words.
:param text: Word that is checked for existence
:return: Whether word exists or not
:rtype: bool
'''
def find_word(text):
    try:
        return next(w for w in words if text == w.text)
    except StopIteration:
        return None


'''
Checks whether two terms are equal regarding case sensitivity.
:param term1: Str of term1
:param term2: Str of term2
:return: Whether terms are redundant or not
:rtype: bool
'''
def is_redundant(term1, term2):
    return (term1.lower() in term2.lower() or
            term2.lower() in term1.lower())


'''
Basis query with nmslib.
Recieves vector of to queried word and looks for nearest terms
based on cosine similarity.
:param base_vector: Word-vector of queried term
:param count: Length of the query result
:return: Ordered query-result with terms and respective similarities
:rtype: list
'''
def most_similar(base_vector, count):
    result = nmslib.knnQuery(index, count, base_vector.tolist())
    terms = [(words[idx].text, v.cosine_similarity_normalized(base_vector, words[idx].vector)) for idx in result]
    return terms


'''
Returns nearest neighbors. First position in result is
removed as it is the queried term with similarity 1.0.
:param term: Word to be queried
:param count: Length of the query result
:return: Ordered query-result with terms and respective similarities
:rtype: list
'''
def nearest_neighbors(term, count):
    base_word = find_word(term)
    base_vector = base_word.vector
    result = most_similar(base_vector, count+1)
    if result[0][0] == term:
        result = result[1:]
    else:
        result = result[:-1]
    # for n in range(len(result) - 1, -1, -1):
    #     if is_redundant(term, result[n][0]):
    #         del result[n]
    return result


'''
Performs vector calculation left2 - left1 + right1.
For resulting vector is queried for closest terms.
:param left1: Term 1
:param left2: Term 2
:param right1: Term 3
:return: Ordered query-result with terms and respective similarities
:rtype: list
'''
def analogies(left1, left2, right1, count):
    word_left1 = find_word(left1)
    word_left2 = find_word(left2)
    word_right1 = find_word(right1)
    if (not word_left1) or (not word_left2) or (not word_right1):
        return []
    vector = v.add(v.sub(word_left2.vector,word_left1.vector),word_right1.vector)
    closest = most_similar(vector, count)
    # closest_filtered = [(w, dist) for (w, dist) in closest if not
    #     is_redundant(w, left1) and not is_redundant(w, left2) and not is_redundant(w, right1)]
    return closest


'''
Performs a projection for given word.
:param term: Word that should be projected
:param relation: Type of projection that should be performed
:return: Ordered query-result with terms and respective similarities
:rtype: list
'''
def related_terms(term, relation, count):
    base_word = find_word(term)
    base_vector = base_word.vector
    proj = lrn.get_projection(base_vector, relation)
    print(proj.shape)
    result = most_similar(proj, count)
    # for n in range(len(result) - 1, -1, -1):
    #     if is_redundant(term, result[n][0]):
    #         del result[n]
    return result


'''
Fo inner product of two word-vectors the resulting matrix
is compared with all relation matrices for similarity.
:param termX: Left term
:param termY: Right term
:return: Name of most similar relation matrix
:rtype: str
'''
def related_matrix(termX, termY):
    base_wordX = find_word(termX)
    base_vectorX = base_wordX.vector
    base_wordY = find_word(termY)
    base_vectorY = base_wordY.vector
    return lrn.get_related_matrix(base_vectorX, base_vectorY)


'''
Batch with new training data is added to trainData container. If
an annotation from batch is already in trainData, it won't be added.
Also not, if the annotation-relation is syno, anto, cohypo and the
annotation is already in trainData with swapped x & y values.
:param batch: New annotated word-pairs for training
'''
def add_training_data(batch):
    for i in range(len(batch)):
        x = batch[i]["x"]
        y = batch[i]["y"]
        rel = batch[i]["relation"]
        if rel in trainData:
            d = trainData[rel]
            if (x, y) not in d:
                if rel == 'syno' or rel == 'anto' or rel == 'cohypo':
                    if (y, x) not in d:
                        d.append((x, y))
                        trainData[rel] = d
                else:
                    d.append((x, y))
                    trainData[rel] = d
        else:
            trainData[rel] = [(x, y)]


'''
Deletes all entries in trainData container.
'''
def clear_training_data():
    trainData.clear()


'''
Performs linear regression with gradient descent optimization
on all entries in the trainData container and removes all data
afterwards.
:param alpha: Learning rate
:param numIteration: Iteration count
'''
def train(alpha, numIterations):
    for rel,data in trainData.items():
        X, Y = build_wordpairs(rel, data, dims)
        lrn.gradient_descent(X, Y, rel, alpha, numIterations)
    clear_training_data()


'''
Searches for vectors of corresponding words in trainData and stacks them for later training.
:param rel: Relation type for optional swapped train data for syno, anto, cohypo
:param trainData: Current training batch
:return: Vectors of training words and their respective targets
:rtype: list[ndarray], list[ndarray]
'''
def build_wordpairs(rel, trainData, dims):
    X, Y = [None] * dims, [None] * dims
    for x, y in trainData:
        base_word1 = find_word(x)
        base_word2 = find_word(y)
        X = np.vstack((X, base_word1.vector))
        Y = np.vstack((Y, base_word2.vector))
        # if rel == 'syno' or rel == 'anto' or rel == 'cohypo':
        #     X = np.vstack((X, base_word2.vector))
        #     Y = np.vstack((Y, base_word1.vector))
    return X[1:], Y[1:]


'''
Calculates the delta-values of a current rel matrix, and its initial values.
:param rel: Name of the relation matrix
'''
def get_delta(rel):
    return lrn.get_matrix_delta(rel)


'''
Batch with new training data is added to history file. If
an annotation from batch is already in history, it won't be added.
Also not, if the annotation-relation is syno, anto, cohypo and the
annotation is already in trainData with swapped x & y values.
:param batch: New annotated word-pairs to store in history
'''
def add_history_data(batch):
    with open('app/history.txt', 'r') as json_file:
        history = json.load(json_file)
        for i in range(len(batch)):
            x = batch[i]["x"]
            y = batch[i]["y"]
            rel = batch[i]["relation"]
            d = {'x': x, 'y': y, 'relation': rel}
            if d not in history:
                if rel == 'syno' or rel == 'anto' or rel == 'cohypo':
                    if {'x': y, 'y': x, 'relation': rel} not in history:
                        history.append(d)
                else:
                    history.append(d)
    with open('app/history.txt', 'w') as outfile:
        json.dump(history, outfile)


'''
Returns history data.
:return: All annotated word-pairs in history file
:rtype: json
'''
def get_history():
    with open('app/history.txt', 'r') as json_file:
        history = json.load(json_file)
    return history


'''
Overwrites current history file with new history data.
:param hist: New version of history
'''
def save_history(hist):
    with open('app/history.txt', 'w') as outfile:
        json.dump(hist, outfile)


'''
Loads history file and performs linear regression with gradient descent
on all entries.
:param alpha: Learning rate
:param numIterations: Iteration count
'''
def train_history(alpha, numIterations):
    with open('app/history.txt', 'r') as json_file:
        history = json.load(json_file)
        add_training_data(history)
        train(alpha, numIterations)
    with open('app/history.txt', 'w') as outfile:
        json.dump(history, outfile)


'''
Deletes all enties in history file.
'''
def clear_history():
    with open('app/history.txt') as json_file:
        history = []
    with open('app/history.txt', 'w') as outfile:
        json.dump(history, outfile)


'''
Delete and re-initialize all relation-matrices.
'''
def reset_matrices():
    lrn.reset_matrices(dims)

