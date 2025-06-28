const mongoose = require("mongoose");
const connectDB = require("./config/db"); // adjust path if needed
const User = require("./models/User");

const seed = async () => {
  try {
    await connectDB();

    const dummyUser = new User({
      username: "Divya Dharshini R",
      email: "divya@example.com",
      password: "hashed_dummy_password",
      biometricKey: "sample-biometric-key",
      accountNo: "1234567890",
      bankName: "SBI",
      balance: 45210,
      transactions: [
        {
          date: new Date("2025-06-01"),
          amount: 5000,
          description: "Salary",
          type: "Credit",
        },
        {
          date: new Date("2025-06-10"),
          amount: 1500,
          description: "Electricity Bill",
          type: "Debit",
        },
        {
          date: new Date("2025-06-15"),
          amount: 2200,
          description: "Shopping",
          type: "Debit",
        },
      ],
    });

    await dummyUser.save();
    console.log("✅ Dummy user added to database");
  } catch (error) {
    console.error("❌ Error inserting dummy user:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
