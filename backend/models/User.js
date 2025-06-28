const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  date: Date,
  amount: Number,
  description: String,
  type: String, // "Credit" or "Debit"
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  biometricKey: String,
  accountNo: String,
  bankName: String,
  balance: Number,
  transactions: [transactionSchema],
});

module.exports = mongoose.model("User", userSchema);
