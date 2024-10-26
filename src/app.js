import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
 
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// to accept json format with certain limit
app.use(express.json({limit: "16kb"}));

// to express accept encoded url like +, %40, %20
app.use(express.urlencoded({extended: true, limit:"20kb"}))

// some static file like pdf, and favicon to directly add on public folder 
app.use(express.static("public"));

// cookieparser
app.use(cookieParser())


//routes import 
import userRouter from './routes/user.routes.js'

//routes decleration 
// it says when "/users" is being called, transfer the control to userRouter file 
app.use("/api/v1/users", userRouter);

export { app }