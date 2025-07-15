import os
import numpy as np
import pandas as pd
import random
import tensorflow as tf
from tensorflow.keras import layers, Model, Input
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_curve, auc
import matplotlib.pyplot as plt
from tqdm import tqdm

# PARAMETERS
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'train.csv')
SEQUENCE_LENGTH = 50  # Number of events per session (pad/truncate)
BATCH_SIZE = 128
EPOCHS = 10
EMBEDDING_DIM = 64
LSTM_UNITS = 64

# 1. LOAD DATA
print('Loading data...')
df = pd.read_csv(DATA_PATH)

# 2. PREPARE SESSIONS
# We'll use 'source_file' as session/user ID
sessions = df.groupby('source_file')

# Select numeric features only (exclude source_file, BTN_TOUCH)
exclude_cols = {'source_file', 'BTN_TOUCH'}
feature_cols = [col for col in df.columns if col not in exclude_cols and pd.api.types.is_numeric_dtype(df[col])]

# For each session, extract a fixed-length sequence of features
def get_session_sequence(session_df):
    arr = session_df[feature_cols].values
    if len(arr) >= SEQUENCE_LENGTH:
        return arr[:SEQUENCE_LENGTH]
    else:
        # Pad with zeros if too short
        pad = np.zeros((SEQUENCE_LENGTH - len(arr), len(feature_cols)))
        return np.vstack([arr, pad])

session_data = {}
for session_id, session_df in sessions:
    session_data[session_id] = get_session_sequence(session_df)

session_ids = list(session_data.keys())

# 3. GENERATE PAIRS
print('Generating pairs...')
def make_pairs(session_data, num_pairs=20000):
    pairs = []
    labels = []
    session_ids = list(session_data.keys())
    for _ in tqdm(range(num_pairs)):
        # Positive pair (same user)
        sid = random.choice(session_ids)
        pairs.append([session_data[sid], session_data[sid]])
        labels.append(1)
        # Negative pair (different users)
        sid1, sid2 = random.sample(session_ids, 2)
        pairs.append([session_data[sid1], session_data[sid2]])
        labels.append(0)
    return np.array(pairs), np.array(labels)

pairs, labels = make_pairs(session_data, num_pairs=10000)
X1 = pairs[:,0]
X2 = pairs[:,1]

# Split into train/val
X1_train, X1_val, X2_train, X2_val, y_train, y_val = train_test_split(X1, X2, labels, test_size=0.2, random_state=42)

# 4. BUILD SIAMESE LSTM MODEL
def build_siamese_lstm(input_shape, embedding_dim=EMBEDDING_DIM, lstm_units=LSTM_UNITS):
    input = Input(shape=input_shape)
    x = layers.Masking(mask_value=0.0)(input)
    x = layers.LSTM(lstm_units, return_sequences=False)(x)
    x = layers.Dense(embedding_dim, activation='relu')(x)
    return Model(input, x)

input_shape = (SEQUENCE_LENGTH, len(feature_cols))
base_network = build_siamese_lstm(input_shape)

input_a = Input(shape=input_shape)
input_b = Input(shape=input_shape)
processed_a = base_network(input_a)
processed_b = base_network(input_b)

# Compute L2 distance between embeddings
def euclidean_distance(vects):
    x, y = vects
    return tf.sqrt(tf.reduce_sum(tf.square(x - y), axis=1, keepdims=True))

distance = layers.Lambda(euclidean_distance)([processed_a, processed_b])

# Output: similarity score (0=diff, 1=same)
output = layers.Dense(1, activation='sigmoid')(distance)
model = Model([input_a, input_b], output)
model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

model.summary()

# 5. TRAIN MODEL
print('Training model...')
history = model.fit([X1_train, X2_train], y_train, batch_size=BATCH_SIZE, epochs=EPOCHS, validation_data=([X1_val, X2_val], y_val))

# 6. EVALUATE & VISUALIZE
print('Evaluating...')
y_pred = model.predict([X1_val, X2_val]).ravel()
fpr, tpr, thresholds = roc_curve(y_val, y_pred)
roc_auc = auc(fpr, tpr)

plt.figure(figsize=(6,6))
plt.plot(fpr, tpr, label=f'ROC curve (area = {roc_auc:.2f})')
plt.plot([0,1], [0,1], 'k--')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Siamese LSTM ROC Curve')
plt.legend(loc='lower right')
plt.tight_layout()
plt.savefig(os.path.join(os.path.dirname(__file__), '..', 'data', 'siamese_lstm_roc.png'))
plt.show()

print(f'ROC AUC: {roc_auc:.4f}')

# 7. VISUALIZE EMBEDDINGS (OPTIONAL)
try:
    from sklearn.decomposition import PCA
    emb_train = base_network.predict(X1_train[:1000])
    emb_val = base_network.predict(X1_val[:1000])
    pca = PCA(n_components=2)
    emb_all = np.vstack([emb_train, emb_val])
    emb_2d = pca.fit_transform(emb_all)
    plt.figure(figsize=(6,6))
    plt.scatter(emb_2d[:1000,0], emb_2d[:1000,1], c='blue', label='Train', alpha=0.5)
    plt.scatter(emb_2d[1000:,0], emb_2d[1000:,1], c='red', label='Val', alpha=0.5)
    plt.title('Session Embeddings (PCA)')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), '..', 'data', 'siamese_lstm_embeddings.png'))
    plt.show()
except Exception as e:
    print('Embedding visualization skipped:', e)

print('All done! You can show the ROC curve and embedding plot to the judges.') 