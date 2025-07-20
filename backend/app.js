const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const recordSessionRouter = require("./routes/recordSession");

const app = express();
app.use(bodyParser.json()); // To parse JSON data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api", userRoutes);
app.use("/api", require("./routes/riskRoutes"));
app.use("/api/transfer", require("./routes/transfer"));
const recordSessionRoute = require("./routes/recordSession");
app.use("/api/record-session", recordSessionRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
