import numpy as np

'''
The learning module, providing all training functions.
'''

'''Respective matrices for all relations'''
init, syno, anto, hyper, hypo, cohypo, mero, holo, tropo = None, None, None, None, None, None, None, None, None


'''
Performs projection for given term-vector and relation.
:param term_vector: Vector of the word that should be projected
:param mode: Relation type that should be performed
:return: Resulting new vector for later query
:rtype: ndarray
'''
def get_projection(term_vector, mode):
    projMat = get_matrix(mode)
    projection = np.dot(term_vector, projMat)
    return projection


'''
Linear regression with stochastic gradient descent.
:param X: X-train data
:param Y: Y-train data
:param mode: Name of relation-matrix that should be trained
:param alpha: Learning rate
:param numIterations: Iteration count
'''
def gradient_descent(X, Y, mode, alpha, numIterations):
    print("Start Training - "+mode)
    m = len(X)
    projMat = get_matrix(mode)
    xTrans = X.transpose()
    for i in range(numIterations):
        hypothesis = np.dot(X, projMat)
        loss = hypothesis - Y
        # cost = np.sum(loss ** 2) / (2 * m) # m denotes the number of examples, not the number of features
        # print("Iteration %d | Cost: %f" % (i, cost))
        gradient = np.dot(xTrans, loss) / m
        projMat = projMat - alpha * gradient
    write_matrix(mode, projMat)
    print("Finished Training - " + mode)


'''
Returns current state of respective relation matrix.
:param str mode: The matrix that should be returned
:return: The respective matrix or None if not found
:rtype: ndarray or None
'''
def get_matrix(mode):
    if mode == "syno": return syno
    elif mode == "anto": return anto
    elif mode == "hyper": return hyper
    elif mode == "hypo": return hypo
    elif mode == "cohypo": return cohypo
    elif mode == "mero": return mero
    elif mode == "holo": return holo
    elif mode == "tropo": return tropo
    else: return None


'''
Updates current state of relation matrix.
:param mode: Name of the matrix that should be updated
:param projMat: New matrix values
'''
def write_matrix(mode, projMat):
    global syno, anto, hyper, hypo, cohypo, mero, holo, tropo
    if mode == "syno": syno = projMat
    elif mode == "anto": anto = projMat
    elif mode == "hyper": hyper = projMat
    elif mode == "hypo": hypo = projMat
    elif mode == "cohypo": cohypo = projMat
    elif mode == "mero": mero = projMat
    elif mode == "holo": holo = projMat
    elif mode == "tropo": tropo = projMat
    else: print('No matrix for such relation')


'''
Performs vector product of given word-vectors and calculates
mse of resulting matrix and all relation matrices.
:param termVectorX: Vector of left word
:param termVectorY: Vector of right word
:return: Most similar relation matrix, mean square error
:rtype: str, float
'''
def get_related_matrix(termVectorX, termVectorY):
    global syno, anto, hyper, hypo, cohypo, mero, holo, tropo
    termVectorXtrans = termVectorX.transpose()
    hypothesisMat = np.dot(termVectorXtrans, termVectorY)
    mseSyno = ((syno - hypothesisMat)**2).mean(axis=None)
    mseAnto = ((anto - hypothesisMat) ** 2).mean(axis=None)
    mseHyper = ((hyper - hypothesisMat) ** 2).mean(axis=None)
    mseHypo = ((hypo - hypothesisMat) ** 2).mean(axis=None)
    mseCohypo = ((cohypo - hypothesisMat) ** 2).mean(axis=None)
    mseMero = ((mero - hypothesisMat) ** 2).mean(axis=None)
    mseHolo = ((holo - hypothesisMat) ** 2).mean(axis=None)
    mseTropo = ((tropo - hypothesisMat) ** 2).mean(axis=None)
    results = {"Synonym": mseSyno, "Antonym": mseAnto, "Hypernym": mseHyper, "Hyponym": mseHypo,
               "Cohyponym": mseCohypo, "Meronym": mseMero, "Holonym": mseHolo, "Troponym": mseTropo}
    bestFitting = min(results, key=results.get)
    mse = min(results.values())
    return bestFitting, mse


'''
Calculates deltas of current relation matrix and its initialized values.
:param rel: Relation of matrix deltas should be calculated for
:return: Matrix with respective deltas
:rtype: ndarray
'''
def get_matrix_delta(rel):
    mat = None
    if rel == "syno": mat = syno - init
    elif rel == "anto": mat = anto - init
    elif rel == "hyper": mat = hyper - init
    elif rel == "hypo": mat = hypo - init
    elif rel == "cohypo": mat = cohypo - init
    elif rel == "mero": mat = mero - init
    elif rel == "holo": mat = holo - init
    elif rel == "tropo": mat = tropo - init
    return mat


'''
Re-initializes all matrices with normal distribution.
:param dims: Dimension of word-embedding
'''
def reset_matrices(dims):
    global init, syno, anto, hyper, hypo, cohypo, mero, holo, tropo
    # init = np.zeros((dims, dims))
    init = np.random.normal(0, 0.1, (dims, dims))
    syno, anto, hyper, hypo, cohypo, mero, holo, tropo = init, init, init, init, init, init, init, init
