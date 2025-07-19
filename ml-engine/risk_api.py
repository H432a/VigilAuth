from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np
from verify import check_risk  # Or whichever file loads + runs the model

app = Flask(__name__)
CORS(app)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    features = np.array(data["features"]).reshape(1, -1)  # Shape (1, seq_len)
    
    try:
        risk_label = check_risk(features.tolist())  # returns "low", "medium", "high"
        return jsonify({"risk": risk_label})
    except Exception as e:
        print("Error during prediction:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
