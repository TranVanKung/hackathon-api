import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const { MONGO_ENDPOINT_DEV = "" } = process.env;

const initializeDbConnection = async () => {
  console.log("Connecting to database \n");

  await mongoose
    .connect(MONGO_ENDPOINT_DEV)
    .then(async () => {
      console.log("Connected to database!");
    })
    .catch((err) => {
      console.log(`Can not to connect to database: ${err}`);
    });
};

export { initializeDbConnection };
