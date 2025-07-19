const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  console.log("🔥 /api/transfer route hit", req.body);
  const { fromAccount, toAccount, amount, description } = req.body;

  try {
    const sender = await User.findOne({ accountNo: fromAccount });
    const receiver = await User.findOne({ accountNo: toAccount });

    console.log("👤 Sender:", sender);
    console.log("👤 Receiver:", receiver);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct from sender
    sender.balance -= amount;
    sender.transactions.push({
      date: new Date(),
      amount,
      description,
      type: "Debit",
    });

    // Add to receiver
    receiver.balance += amount;
    receiver.transactions.push({
      date: new Date(),
      amount,
      description,
      type: "Credit",
    });

    await sender.save();
    await receiver.save();

    res.json({ message: "Transfer successful" });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
