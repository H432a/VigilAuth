const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const fs = require("fs");
const User = require("../models/User");
const path = require("path");

router.post("/", async (req, res) => {
  const { session, fromAccount, toAccount, amount, description } = req.body;
  console.log("🔥 Transfer request received:", req.body);
  try {
    // STEP 1: Save session data to temp CSV for ML model
    const featureHeaders = "X,Y,Pressure,Duration,Orientation,Size\n";
    const rows = session.map(
      (d) =>
        `${d.X},${d.Y},${d.Pressure || 0.5},${d.Duration || 120},${
          d.Orientation || 0
        },${d.Size || 0.5}`
    );
    const csvData = featureHeaders + rows.join("\n");
    const inputPath = path.join(__dirname, "../ml/temp_input.csv");
    fs.writeFileSync(inputPath, csvData);

    // STEP 2: Spawn Python ML process
    const py = spawn("python", ["ml/verify.py"]);
    let mlOutput = "";

    py.stdout.on("data", (data) => {
      mlOutput += data.toString();
      console.log("ML Raw Output:", mlOutput);
    });

    py.stderr.on("data", (data) => {
      console.error("ML Error:", data.toString());
    });

    py.on("close", async () => {
      const score = parseFloat(mlOutput.trim());
      console.log("ML Similarity Score:", score);

      if (isNaN(score)) {
        return res.status(500).json({ message: "Invalid ML output" });
      }

      // STEP 3: Risk classification
      let risk = "low";
      if (score < 0.4) risk = "high";
      else if (score < 0.65) risk = "medium";

      // STEP 4: Block high risk
      if (risk === "high") {
        return res.status(401).json({
          message: "High Risk Detected! Transfer blocked.",
          risk,
          score: score.toFixed(2),
        });
      }

      // STEP 5: Proceed with transfer
      const sender = await User.findOne({ accountNo: fromAccount });
      const receiver = await User.findOne({ accountNo: toAccount });

      if (!sender || !receiver) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (sender.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      sender.balance -= amount;
      receiver.balance += amount;

      const now = new Date();
      sender.transactions.push({
        date: now,
        amount,
        description,
        type: "Debit",
      });
      receiver.transactions.push({
        date: now,
        amount,
        description,
        type: "Credit",
      });

      await sender.save();
      await receiver.save();

      return res.status(200).json({
        message: "Transfer successful",
        risk,
        score: score.toFixed(2),
      });
    });
  } catch (err) {
    console.error("Transfer Error:", err);
    return res.status(500).json({ message: "Server error during transfer" });
  }
});

module.exports = router;
