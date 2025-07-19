const mongoose = require("mongoose");
const connectDB = require("./config/db"); // adjust path if needed
const User = require("./models/User");

const seed = async () => {
  try {
    await connectDB();

    const dummyUsers = [
      {
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
      },
      {
        username: "Aarav Mehta",
        email: "aarav@example.com",
        password: "hashed_aarav_pass",
        biometricKey: "aarav-biometric",
        accountNo: "9876543210",
        bankName: "HDFC",
        balance: 30000,
        transactions: [
          {
            date: new Date("2025-06-03"),
            amount: 10000,
            description: "Freelance Project",
            type: "Credit",
          },
          {
            date: new Date("2025-06-07"),
            amount: 2000,
            description: "Groceries",
            type: "Debit",
          },
        ],
      },
      {
        username: "Meera Nair",
        email: "meera@example.com",
        password: "hashed_meera_pass",
        biometricKey: "meera-biometric",
        accountNo: "1122334455",
        bankName: "ICICI",
        balance: 75000,
        transactions: [
          {
            date: new Date("2025-06-05"),
            amount: 20000,
            description: "Bonus",
            type: "Credit",
          },
          {
            date: new Date("2025-06-12"),
            amount: 3000,
            description: "Rent",
            type: "Debit",
          },
        ],
      },
    ];

    await User.insertMany(dummyUsers);
    console.log("✅ All dummy users added to database");
  } catch (error) {
    console.error("❌ Error inserting dummy users:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
