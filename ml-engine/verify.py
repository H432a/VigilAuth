# ml-engine/verify.py
import torch, json, numpy as np
from siamese_lstm_test_pytorch import SiameseLSTM
SEQUENCE_LENGTH, EMBEDDING_DIM, LSTM_UNITS = 50, 64, 64
DEVICE = torch.device('cpu')

model = SiameseLSTM(input_dim=3, lstm_units=LSTM_UNITS, embedding_dim=EMBEDDING_DIM)
model.load_state_dict(torch.load("data/siamese_lstm_pytorch.pt", map_location=DEVICE))
model.eval()

current = np.array(json.load(open("ml-engine/temp_session.json")), dtype=np.float32)
if len(current) < SEQUENCE_LENGTH:
    pad = np.zeros((SEQUENCE_LENGTH - len(current), 3))
    current = np.vstack([current, pad])
else:
    current = current[:SEQUENCE_LENGTH]

enroll = np.load("ml-engine/enroll_session.npy")
x1 = torch.tensor([enroll], dtype=torch.float32)
x2 = torch.tensor([current], dtype=torch.float32)

with torch.no_grad():
    dist = model(x1, x2)
    sim = -dist
    prob = torch.sigmoid(sim).item()
    print(prob)
