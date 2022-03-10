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
    // _id도 절대 경로로 넘기기, assets는 절대 경로를 string으로 넘기자.
    const _id = process.env.KEYPAIR;
    const assets = fs.readdirSync(process.env.ASSETS).map(file => path.join(process.env.ASSETS, file));
    routes(app,db, _id, assets);
    app.listen(process.env.PORT || 8082, () => {
        console.log('listening on port 8082');
     })
})