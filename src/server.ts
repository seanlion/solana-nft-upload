import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import express from 'express';
const app =express();
import {routesFunc} from './routes.js';
import { MongoClient } from 'mongodb'
//const mongodb = new MongoClient(process.env.DB);
app.use(express.json())

// 정보 담을 db 
// routes에 필요한 인자 넘겨야 함.
const _id = process.env.KEYPAIR;
routesFunc(app,_id);
app.listen(process.env.PORT || 8082, () => {
console.log('listening on port 8082');
})
