import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app =express();
import {routesFunc} from './routes.js';
app.use(express.json())

const _id = process.env.KEYPAIR;
routesFunc(app,_id);
app.listen(process.env.PORT || 8082, () => {
console.log('listening on port 8082');
})
