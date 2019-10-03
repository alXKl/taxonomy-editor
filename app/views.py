from flask import render_template, request
from app.logic import operations as o
import json
import os
import sys
# noinspection PyUnresolvedReferences
from werkzeug import secure_filename


from app import app

EMBEDDINGS_FOLDER = 'app/embeddings/'
UPLOAD_FOLDER = 'app/uploads/'

app.config['EMBEDDINGS_FOLDER'] = EMBEDDINGS_FOLDER
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


ALLOWED_EXTENSIONS = set(['txt', 'bin', 'matrix', 'vec'])
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

'''
Test if file is existing.
'''
def file_accessible(filepath, mode):
    try:
        f = open(filepath, mode)
        f.close()
    except IOError as e:
        return False
    return True


'''
Upload own custom model.
'''
@app.route('/upload', methods=['GET', 'POST'])
def upload_model():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            present = file_accessible(UPLOAD_FOLDER + filename, 'r')
            if not present:
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                o.load_embedding(UPLOAD_FOLDER + filename)
                o.create_index()
                print(filename + ' embedding loaded.', file=sys.stderr)
                os.remove(UPLOAD_FOLDER + filename)
                return 'Success'
            else:
                return 'file already present'
    return "Error"


'''
Load one of default german or english word-model
'''
@app.route('/model', methods=['POST'])
def get_model():
    lang = request.form['model']
    if lang == 'german':
        o.load_embedding(EMBEDDINGS_FOLDER+'GloVe_vectors.txt')
        o.load_index(EMBEDDINGS_FOLDER+'indexGloVe_vectors')
    else:
        o.load_embedding(EMBEDDINGS_FOLDER + 'Gensim_skipgram.txt')
        o.load_index(EMBEDDINGS_FOLDER + 'indexGensim_skipgram')

    print(lang+' embedding loaded.', file=sys.stderr)
    return 'Success'


'''
Generate new random term.
'''
@app.route('/random', methods=['POST', 'GET'])
def get_random():
    words = []
    j = json.loads(request.data)
    n=0
    for i in j:
        words.append(j.get(str(n)))
        n+=1
    response = o.get_random_term(words)
    return response


'''
Check if word is existing in embedding.
'''
@app.route('/checkword', methods=['POST'])
def word_in_embedding():
    term = str(request.form['term'])
    response = o.term_exists(term)
    return str(response)


'''
Get deltas for specific relation-type.
'''
@app.route('/projection', methods=['POST'])
def get_matrix_delta():
    relation = str(request.form['relation'])
    response = o.get_delta(relation).tolist()
    return json.dumps(response)


'''
Train data from temporary batch.
'''
@app.route('/trainbatch', methods=['POST'])
def train_batch():
    # batch = request.get_json()
    data = request.get_json()
    batch = data['batch']
    alpha = float(data['alpha'])
    iterations = int(data['iterations'])
    o.add_training_data(batch)
    o.add_history_data(batch)
    o.train(alpha, iterations)
    return 'Batch trained'


'''
Predict terms for given word and relation-type
'''
@app.route('/relationnode', methods=['POST'])
def get_related_terms():
    relation = str(request.form['relation'])
    term = str(request.form['term'])
    count = int(request.form['count'])
    if relation == "NN":
        result = o.nearest_neighbors(term, count)
    else:
        result = o.related_terms(term, relation, count)
    d = {}
    for i in range(len(result)):
        d[i] = {}
        d[i]['word'] = result[i][0]
        d[i]['value'] = round(result[i][1], 3)
    return json.dumps(d)


'''
Calculate analogies.
'''
@app.route('/analogies', methods=['POST'])
def get_analogies():
    term1 = str(request.form['term1'])
    term2 = str(request.form['term2'])
    term3 = str(request.form['term3'])
    count = int(request.form['count'])
    result = o.analogies(term1, term2, term3, count)
    d = {}
    for i in range(len(result)):
        d[i] = {}
        d[i]['word'] = result[i][0]
        d[i]['value'] = round(result[i][1], 3)
    return json.dumps(d)


'''
Predict a relation-type for a word-pair.
'''
@app.route('/relationlink', methods=['POST'])
def get_related_links():
    source = str(request.form['source'])
    target = str(request.form['target'])
    relation, mse = o.related_matrix(source, target)
    d = {}
    d[0] = {}
    d[0]['relation'] = relation
    d[0]['mse'] = round(mse, 3)
    return json.dumps(d)


'''
Re-initialize all projection-matrices.
'''
@app.route('/resetmat', methods=['POST','GET'])
def reset_matrices():
    o.reset_matrices()
    print('Matrices reseted.', file=sys.stderr)
    return 'Success'


'''
Get all history data.
'''
@app.route('/history', methods=['POST','GET'])
def history():
    response = o.get_history()
    print('History send', file=sys.stderr)
    return json.dumps(response)


'''
Clear all annotations in history.
'''
@app.route('/clearhistory', methods=['POST','GET'])
def clear_history():
    o.clear_history()
    print('History cleared.', file=sys.stderr)
    return 'Success'


'''
Train on all history data.
'''
@app.route('/learnhistory', methods=['POST'])
def train_history():
    alpha = float(request.form['alpha'])
    iterations = int(request.form['iterations'])
    o.train_history(alpha, iterations)
    return 'Success'


'''
Save edited history.
'''
@app.route('/savehistory', methods=['POST'])
def save_history():
    hist = request.get_json()
    o.save_history(hist)
    return 'Success'


'''
Call editor interface at /
'''
@app.route('/')
def ui():
    return render_template('index.html')