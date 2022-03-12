require('dotenv').config();
const path = require("path");
const express= require('express')
const app =express()
const routes = require('./routes')
const Web3 = require('web3');
const mongodb = require('mongodb').MongoClient
const fs = require('fs');
app.use(express.json())

mongodb.connect(process.env.DB,{ useUnifiedTopology: true },
    async (err,client)=>{
    // 정보 담을 db 
    const db =client.db('cluster0')
    // routes에 필요한 인자 넘겨야 함.
    const _id = process.env.KEYPAIR;
    routes(app,db, _id);
    app.listen(process.env.PORT || 8082, () => {
        console.log('listening on port 8082');
     })
})