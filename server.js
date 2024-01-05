import app from "./app.js";
import { connectedDB } from "./config/database.js";
import cloudinary from 'cloudinary';
 

connectedDB();

cloudinary.v2.config({
        cloud_name: 'dcdq7kxbl', 
        api_key: '842961535548133', 
        api_secret: '5-_cd3plv3apR51Eq6ZtX_CsfgM' 
      
})
 
 
 

app.listen(process.env.PORT,()=>{
console.log(`server is running on port: ${process.env.PORT}`)
})