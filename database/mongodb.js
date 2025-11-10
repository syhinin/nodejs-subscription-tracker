import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_DB_URI, {});

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host} in ${process.env.NODE_ENV} environment`
    );
  } catch (error) {
    console.error(`Error connecting to database: ${error.message}`);
    process.exit(1);
  }
};

export default connectDatabase;
