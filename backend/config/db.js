const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb://divyadharshinir257:tmXsb5b4qqQfNW6o@parksmart-shard-00-00.vrlgw.mongodb.net:27017,parksmart-shard-00-01.vrlgw.mongodb.net:27017,parksmart-shard-00-02.vrlgw.mongodb.net:27017/?replicaSet=atlas-iax1yz-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=parksmart",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
