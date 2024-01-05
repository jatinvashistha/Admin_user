import express from "express";
import {config} from "dotenv"
import ErrorMiddleware from "./middlewares/Error.js"
import cookieParser from "cookie-parser";
import cors from "cors";

config({
    path:"./config/config.env",
})

const app = express()

// using middleware
app.use(express.json());
app.use(express.urlencoded({
    extended:true,
}));

app.use(cookieParser());

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
    methods:["GET","POST","PUT","DELETE"],

}))


  import user from "./routes/userRoutes.js"
 
 app.use("/api/v1", user)
 

export default app;

app.get("/",(req,res)=>{
    res.send(
       ` <h1>Site is Working. Click <a href=${process.env. FRONTEND_URL}>here</a> to vist frontend.</h1>`
    )
})

app.use(ErrorMiddleware);

//https://jlqc2m-4000.csb.app