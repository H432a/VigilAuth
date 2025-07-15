import os
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import roc_curve, auc
import matplotlib.pyplot as plt
from tqdm import tqdm
import random

# PARAMETERS
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'test.csv')
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'siamese_lstm_pytorch.pt')
SEQUENCE_LENGTH = 50
BATCH_SIZE = 128
EMBEDDING_DIM = 64
LSTM_UNITS = 64
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 1. LOAD DATA
df = pd.read_csv(DATA_PATH)
exclude_cols = {'source_file', 'BTN_TOUCH'}
feature_cols = [col for col in df.columns if col not in exclude_cols and pd.api.types.is_numeric_dtype(df[col])]
sessions = df.groupby('source_file')

def get_session_sequence(session_df):
    arr = session_df[feature_cols].values
    if len(arr) >= SEQUENCE_LENGTH:
        return arr[:SEQUENCE_LENGTH]
    else:
        pad = np.zeros((SEQUENCE_LENGTH - len(arr), len(feature_cols)))
        return np.vstack([arr, pad])

session_data = {}
for session_id, session_df in sessions:
    session_data[session_id] = get_session_sequence(session_df)
session_ids = list(session_data.keys())

# 2. GENERATE PAIRS
def make_pairs(session_data, num_pairs=5000):
    pairs = []
    labels = []
    session_ids = list(session_data.keys())
    for _ in tqdm(range(num_pairs)):
        # Positive pair
        sid = random.choice(session_ids)
        pairs.append([session_data[sid], session_data[sid]])
        labels.append(1)
        # Negative pair
        sid1, sid2 = random.sample(session_ids, 2)
        pairs.append([session_data[sid1], session_data[sid2]])
        labels.append(0)
    return np.array(pairs), np.array(labels)

pairs, labels = make_pairs(session_data, num_pairs=2500)
X1 = pairs[:,0]
X2 = pairs[:,1]

# 3. DATASET & DATALOADER
class SiameseDataset(Dataset):
    def __init__(self, X1, X2, y):
        self.X1 = torch.tensor(X1, dtype=torch.float32)
        self.X2 = torch.tensor(X2, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)
    def __len__(self):
        return len(self.y)
    def __getitem__(self, idx):
        return self.X1[idx], self.X2[idx], self.y[idx]

test_dataset = SiameseDataset(X1, X2, labels)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

# 4. MODEL (must match training)
class SiameseLSTM(nn.Module):
    def __init__(self, input_dim, lstm_units, embedding_dim):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, lstm_units, batch_first=True)
        self.fc = nn.Linear(lstm_units, embedding_dim)
    def forward_once(self, x):
        out, _ = self.lstm(x)
        out = out[:,-1,:]
        out = torch.relu(self.fc(out))
        return out
    def forward(self, x1, x2):
        emb1 = self.forward_once(x1)
        emb2 = self.forward_once(x2)
        dist = torch.norm(emb1 - emb2, p=2, dim=1)
        return dist

input_dim = len(feature_cols)
model = SiameseLSTM(input_dim, LSTM_UNITS, EMBEDDING_DIM).to(DEVICE)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()

# 5. EVALUATE
all_preds = []
all_targets = []
with torch.no_grad():
    for x1, x2, y in tqdm(test_loader):
        x1, x2 = x1.to(DEVICE), x2.to(DEVICE)
        dist = model(x1, x2)
        sim = -dist
        preds = torch.sigmoid(sim).cpu().numpy()
        all_preds.append(preds)
        all_targets.append(y.numpy())
all_preds = np.concatenate(all_preds)
all_targets = np.concatenate(all_targets)

# 6. METRICS & VISUALIZATION
fpr, tpr, thresholds = roc_curve(all_targets, all_preds)
roc_auc = auc(fpr, tpr)

# Calculate accuracy at threshold 0.5
pred_labels = (all_preds >= 0.5).astype(int)
accuracy = (pred_labels == all_targets).mean()

plt.figure(figsize=(6,6))
plt.plot(fpr, tpr, label=f'ROC curve (area = {roc_auc:.2f})')
plt.plot([0,1], [0,1], 'k--')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Siamese LSTM ROC Curve (PyTorch, Test Set)')
plt.legend(loc='lower right')
plt.tight_layout()
plt.savefig(os.path.join(os.path.dirname(__file__), '..', 'data', 'siamese_lstm_roc_pytorch_test.png'))
plt.show()
print(f'ROC AUC (test set): {roc_auc:.4f}')
print(f'Prediction Accuracy (test set): {accuracy:.4f}')

print('Test evaluation complete! Show the ROC curve and accuracy to the judges.') 