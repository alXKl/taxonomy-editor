# Taxonomy Editor for Word Embeddings
This is a flask web-application, designed to visualize operations on word-embeddings
with a d3-graph. Additionally, the application provides the possibility to learn 
user-annotaded relations between a pair of words. Given an existing word and some chosen
relation, a new word can then be predicted and generated into the graph. For two words, you
can also predict the best matching relation type.

## 1. Dependencies
The project's dependencies are kept to be as minimal as possible, resulting in only few 
core librararies:

```console
numpy
nmslib
flask
flask-restful
werkzeug
```
All required javascripts and style-sheets are provided in the project so you can run the 
application fully offline.

## 2. Setup with Docker

In the project directory build the image
```console
$ docker build -t taxeditor:latest .
```
After the build, which can take some time, run the container
```console
$ docker run -it -d -p 5000:5000
```
The application is hosted afterwards on
```console
http://localhost:5000/
```

While building the image, **pip** will be downgraded to **v 9.0.3** for a proper installation
of **pybind11**. Otherwise **nmslib** won't be installed correctly on the image.


## 3. Requirements
The editor comes with two own default word-embeddings, for german and english. The german 
consists of 395093 Glove-vectors. The english is a gensim skipgram wikipedia dump of 2017 with the 
size of 291186 word vectors. In total, be ready to provide about
```console
3 GB RAM
```
You can also upload your own word model. The application operates on embeddings of any dimensionality. 
Only constraint is having the vectors strictly the form
```console
word val_1 val_2 ... val_n
```
So e.g. there shouldn't be pos tags or any other additional informations.

## 4. Manual

###4.1. Load word models
First, choose one of the two german or english word models. The third option is to select an own 
custom model from your directory to work with. Afterwards hit the *Load* button and the respective 
embedding will loaded into the application. While loading, all vectors are normalized to **L2 norm**.
If you load your own model, it will be indexed  by the nmslib module automatically.

###4.2. Add new words
With a word-embedding initialized, you can start to build a graph. Provide new terms with the 
text input field. The app will accept only words that are contained in the respective loaded model. 
Alternatively, you can generate some random term of the word model by double-clicking anywhere on 
the canvas. A selected word can be removed from the graph anytime by hitting remove/delete, or with 
the **context-menu on right-clicking the word**.

###4.3. Basic word-embedding operations
Generate the **Nearest Neighbors** of a word by right-clicking a word and selecting the respective 
option. The **query-result window** will pop up, showing the respective terms ordered by their cosine-
similarities. With selecting a word from the result, it will be integrated into the graph. The 
**query-result size** can be changed from 1 - 20 anytime at the top bar.\
\
The other basic operation are **Analogies**. Here you just have to select three different words 
successively in a semantic order and choose the analogy operation from the context-menu. E.g. selecting 
the words Germany - Berlin - China after another, should ideally generate some chinese cities, in best 
case Peking since it's the capital like Berlin. The mathematical vector operation done here is
```console
word_2 - word_1 + word_3
```
For the resulting vector, the app then shows the nearest neighbors in the vector space.

###4.4. Annotating relations
For the later on learning process, relation types have to be annotated between two words first. Therefor
drag a link between two words. A grey link is indicating no relation yet. For annotating the link, 
open the context-menu by right-clicking the link and chose the respective relation-type in *Annotate*.
An alternative, and probably the smoother option, is just **pressing one of the respective relation fields
at the bottom-bar**.\
Currently, the editor supports the distinction of eight different relation types:

| Type          | Semantic             | Example             |
|---------------|----------------------|---------------------|
| Synonym       | same                 | sick - ill          |
| Antonym       | different            | good - bad          |
| Hypernym      | superordinate        | tulip - flower      |
| Hyponym       | subordinate          | plant - flower      |
| Cohyponym     | shared hypernym      | man - woman (human) |
| Meronym       | part of              | tree - bark         |
| Holonym       | entire               | tree - forest       |
| Troponym      | generalization       | spin - move         |

Relations can be further categorized in **directed** and **undirected** relations, indicated by an arrowed or 
non-arrowed link in the graph. Whereas Synonyms, Antonyms and Cohyponyms have no direction, the other relation 
types represent some semantic ordering.

Because there is no definition of a relation in the appliation before the learning process, you can 
in fact introduce an own relation type and treat it as one of the above relations. Just make sure to
be consistent when annotating over the whole process.

###4.5. Learning & Predicting
Whith annotating word-pairs, training data is created in the form of
```console
{"x":"word_1","y":"word_2","relation":"relation-type"}
```
and is collected in a temporary batch. With opening the *Learing* panel you can see how many annotations have been 
collected so far for every relation type. Based on their count you can adjust the **learning-rate** and the number 
of **iterations** and train the respective relation by selecting it.\
Note that there can be several annotations for a word-pair. For example, some might annotate cat - dog 
as an Antonym and then annotate it as a Cohyponym (sharing Hypernym 'mammal'). Both would make sense
and so both annotations are integrated into the training-batch, while showing only the last annotation
in the graph.\
However, the system detects if a word-pair was already annotated with the same relation in the past 
and won't add it to the training data. Also, for non-directed relations the annotation word_1 - word_2
won't be considered for tarining if the annotation word_2 - word_1 is already present for this relation.

When learning the annotations for a specific relation type, or the whole batch at once, the respective data
is cleared form the batch afterwards, allowing to add any kind of annotations again. You can also clear the 
batch manually in the *Learning* panel anytime.

The learning process used here is based on 
[Learning Semantic Hierarchies via Word Embeddings](https://www.researchgate.net/publication/270877882_Learning_Semantic_Hierarchies_via_Word_Embeddings).
For every relation-type a **Projection Matrix** is initialized with normal distribution of zero and std 0.1.
With the provided training-data, the mean square error of
```console
x Φ - y
```
is minimized, making it a linear regression problem. Here x and y are the word-vectors of the terms in 
the annotation, and Φ the respective projection matrix to be trained. For optimization a SGD algorithm for 
matrices is being used.

To **predict related terms for a word**, choose *Find Related Term* from the context-menu on a node. The 
dot-product of the given word and the projection matrix for the chosen relation is then being calculated. 
For the resulting vector the nearest neighbors are queried and represented.\
If there is a match in the result-set, select this word and it will be integrated into the graph with the 
corresponding relation-color. If there are no matching words, click so in the result-window. Either
way, the **precision of predictions is maintained, based on your selection, in the relation fields at the 
bottom**.

To **predict a relation type given a word-pair**, open the context menu on the link of the two words and 
select *Find Relation*. The dot-product of the two word-vectors is calculated and the resulting matrix is 
being matched with the existing projection matrices for overall error. The result is the best matching 
relation-type with the overall error. Selecting the relation from the result-window will color the 
corresponding link, but have no effect on the precisions in the bottom fields.

All matrices can be reset anytime in the *Learning* panel, re-initializing them with a new normal distribution.
By doing so, the precisions of predictions so far, will be reset as well.


###4.6. Projection deltas
The application can visualize the adaptation of a projection-matrix being made during training. Therefor the
deltas of a relation matrix are calculated with regard to it's initialized values. The outcome is a heatmap 
that can be seen under *Projections*.\
The hypothesis here is that a specific relation-matrix is getting specialized on some areas in the vector-space, 
indicating it by a shift of it's values during training. For this observation, however, there must be sufficient 
and appropriate training data available, what brings us to the next feature of the application.

###4.6. History
Whenever data of the temporary batch is being learned, all annotations are written into the persistent history 
parallelly. Like the temporary batch, the history prevents duplicate annotations and x - y annotations
of undirected relations, if an y - x annotation is already present.\
The whole annotation history can be shown and edited under *History*. There you can also create a graph based on the 
whole history.\
In *Learning* you can train the projection-matrices solely from the history data with *Learn History*.\
It should be noted to **Clear History** under *History* whenever you change a word model. By not doing this there 
is a big risk to have words in the history not represented in your word-embedding, leading to corrupted operations.






    

    





