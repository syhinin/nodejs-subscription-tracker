import mongoose from "mongoose";

mongoose
  .connect(
    "mongodb://syhinin_db_user:PzP9EOfmGJ2mkwjK@ac-mz19sk3-shard-00-00.lxqkry2.mongodb.net:27017,ac-mz19sk3-shard-00-01.lxqkry2.mongodb.net:27017,ac-mz19sk3-shard-00-02.lxqkry2.mongodb.net:27017/?ssl=true&replicaSet=atlas-2tuep5-shard-0&authSource=admin&retryWrites=true&w=majority",
    { family: 4 }
  )
  .then(() => {
    console.log("Connected!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection failed:", err);
    process.exit(1);
  });
