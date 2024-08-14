"use strict";

// Setup express
import express from "express";
const app = express();
app.use(express.json());
import userRoute from './userRoute.js';
import loginRoute from './loginRoute.js';
import connectRoute from "./connectRoute.js";
const port = process.env.PORT;

// Setup MongoDB
import mongoose from "mongoose";
mongoose.set('strictQuery', true);
(async () => {
	await mongoose.connect(process.env.MONGO_CONN_STRING + process.env.MONGO_DB_NAME);
})().catch(err => console.log('MongoDB Error', err));

// Setup redis
import redis from "redis";
const client = redis.createClient(process.env.REDIS_ADDRESS, process.env.REDIS_PORT)
client.on('error', err => console.log('Redis Client Error', err));
(async () => {
	await client.connect();
})();

// Setup schema and model for users
import { userSetup } from "./user.js";
userSetup();

// Routes all requests related to users to userRoute.js
app.use('/api/v1/users', userRoute(client));
// Routes all requests related to login to loginRoute.js
app.use('/api/v1/login', loginRoute(client));
// Routes all requests related to connecting to connectRoute.js
app.use('/api/v1/connect', connectRoute(client));

// Starts the server lisening on the provided port above
var server = app.listen(port, () => {});