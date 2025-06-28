const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Signup Controller
exports.signup = async (req, res) => {
  const { accountNo, username, email, password, bankName } = req.body;

  try {
    const user = await User.findOne({ accountNo });

    if (!user) {
      return res
        .status(404)
        .json({ msg: "Account not found. Please contact your bank." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update dummy user with signup details
    user.username = username;
    user.email = email;
    user.password = hashedPassword;
    user.bankName = bankName;

    // Store a unique biometric key (can use accountNo or generate UUID)
    user.biometricKey = `biometric-${accountNo}`;

    await user.save();

    res.status(201).json({ msg: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Login Controller (Biometric only)
exports.login = async (req, res) => {
  const { biometricKey } = req.body;

  try {
    const user = await User.findOne({ biometricKey });

    if (!user) {
      return res.status(400).json({ msg: "Biometric authentication failed" });
    }

    res.status(200).json({
      msg: "Login successful",
      user: {
        username: user.username,
        accountNo: user.accountNo,
        balance: user.balance,
        transactions: user.transactions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
