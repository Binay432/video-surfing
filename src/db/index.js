import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try{

        // we can hold the referecne of the connection 
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        //it's always a good approach to console in which host the connection is used
        // as there's  db for prod, dev  is different 

        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`);

    }catch (error) {
        console.log("MONGODB connection error ", error);
        // unlike exiting through throw code, we can use proces feature from node:
        //porocess.exit() parameter refer to different meaning
        process.exit(1);
    }
}

export default connectDB;