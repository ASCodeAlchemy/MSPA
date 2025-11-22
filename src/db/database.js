import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_Name } from "../constants.js";
dotenv.config();

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URL);
        console.log(`MongoDB Connected DB Host : ${conn.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1);
    }
};


