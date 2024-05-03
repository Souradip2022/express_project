import mongoose from 'mongoose';

import {DB_NAME} from "../constants.js";

const connectDB = async () => {
  try{
    const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n MongoDB connected successfully !! DB HOST: ${connectInstance.connection.host}`);
  }
  catch(err){
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }

}

export default connectDB;