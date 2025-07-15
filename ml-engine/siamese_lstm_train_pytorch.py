import os
import numpy as np
import pandas as pd
import random
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_curve, auc
import matplotlib.pyplot as plt
from tqdm import tqdm

# PARAMETERS
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'train.csv')
SEQUENCE_LENGTH = 50
BATCH_SIZE = 128
EPOCHS = 10
EMBEDDING_DIM = 64
LSTM_UNITS = 64
LEARNING_RATE = 1e-3
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 1. LOAD DATA
print('Loading data...')
df = pd.read_csv(DATA_PATH)

# 2. PREPARE SESSIONS
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

# 3. GENERATE PAIRS
print('Generating pairs...')
def make_pairs(session_data, num_pairs=20000):
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

pairs, labels = make_pairs(session_data, num_pairs=10000)
X1 = pairs[:,0]
X2 = pairs[:,1]

# Split into train/val
X1_train, X1_val, X2_train, X2_val, y_train, y_val = train_test_split(X1, X2, labels, test_size=0.2, random_state=42)

# 4. DATASET & DATALOADER
class SiameseDataset(Dataset):
    def __init__(self, X1, X2, y):
        self.X1 = torch.tensor(X1, dtype=torch.float32)
        self.X2 = torch.tensor(X2, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)
    def __len__(self):
        return len(self.y)
    def __getitem__(self, idx):
        return self.X1[idx], self.X2[idx], self.y[idx]

train_dataset = SiameseDataset(X1_train, X2_train, y_train)
val_dataset = SiameseDataset(X1_val, X2_val, y_val)
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

# 5. MODEL
class SiameseLSTM(nn.Module):
    def __init__(self, input_dim, lstm_units, embedding_dim):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, lstm_units, batch_first=True)
        self.fc = nn.Linear(lstm_units, embedding_dim)
    def forward_once(self, x):
        out, _ = self.lstm(x)
        out = out[:,-1,:]  # last hidden state
        out = torch.relu(self.fc(out))
        return out
    def forward(self, x1, x2):
        emb1 = self.forward_once(x1)
        emb2 = self.forward_once(x2)
        dist = torch.norm(emb1 - emb2, p=2, dim=1)
        return dist

input_dim = len(feature_cols)
model = SiameseLSTM(input_dim, LSTM_UNITS, EMBEDDING_DIM).to(DEVICE)

# 6. LOSS & OPTIMIZER
criterion = nn.BCEWithLogitsLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

# 7. TRAINING LOOP
def train_epoch(model, loader, optimizer, criterion):
    model.train()
    total_loss = 0
    for x1, x2, y in loader:
        x1, x2, y = x1.to(DEVICE), x2.to(DEVICE), y.to(DEVICE)
        optimizer.zero_grad()
        dist = model(x1, x2)
        # Convert distance to similarity (smaller dist = more similar)
        sim = -dist
        loss = criterion(sim, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * x1.size(0)
    return total_loss / len(loader.dataset)

def eval_epoch(model, loader, criterion):
    model.eval()
    total_loss = 0
    preds = []
    targets = []
    with torch.no_grad():
        for x1, x2, y in loader:
            x1, x2, y = x1.to(DEVICE), x2.to(DEVICE), y.to(DEVICE)
            dist = model(x1, x2)
            sim = -dist
            loss = criterion(sim, y)
            total_loss += loss.item() * x1.size(0)
            preds.append(torch.sigmoid(sim).cpu().numpy())
            targets.append(y.cpu().numpy())
    preds = np.concatenate(preds)
    targets = np.concatenate(targets)
    return total_loss / len(loader.dataset), preds, targets

print('Training model...')
best_val_loss = float('inf')
for epoch in range(EPOCHS):
    train_loss = train_epoch(model, train_loader, optimizer, criterion)
    val_loss, val_preds, val_targets = eval_epoch(model, val_loader, criterion)
    print(f'Epoch {epoch+1}/{EPOCHS} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}')
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        torch.save(model.state_dict(), os.path.join(os.path.dirname(__file__), '..', 'data', 'siamese_lstm_pytorch.pt'))

# 8. EVALUATE & VISUALIZE
print('Evaluating...')
fpr, tpr, thresholds = roc_curve(val_targets, val_preds)
roc_auc = auc(fpr, tpr)
plt.figure(figsize=(6,6))
plt.plot(fpr, tpr, label=f'ROC curve (area = {roc_auc:.2f})')
plt.plot([0,1], [0,1], 'k--')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Siamese LSTM ROC Curve (PyTorch)')
plt.legend(loc='lower right')
plt.tight_layout()
plt.savefig(os.path.join(os.path.dirname(__file__), '..', 'data', 'siamese_lstm_roc_pytorch.png'))
plt.show()
print(f'ROC AUC: {roc_auc:.4f}')

print('All done! You can show the ROC curve to the judges.') 