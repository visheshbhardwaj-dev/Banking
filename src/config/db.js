const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment");
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to DB");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    throw err;
  }
}

module.exports = connectDB;
