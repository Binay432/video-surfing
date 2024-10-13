import dotenv from "dotenv";
import connectDB from "./db/index.js"; //caution : import entire file, and not just ./db

dotenv.config({
    path: './env'
})

connectDB();