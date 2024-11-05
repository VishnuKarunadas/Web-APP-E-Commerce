const express = require("express");
const  app = express();
const env = require("dotenv").config()
const db = require("./config/db")
db()
const PORT = process.env.PORT || 7777










app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`);
    
})
