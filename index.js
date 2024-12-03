const express=require('express');
const app=express();
const mongoose=require('mongoose');
PORT=5000;
DB_URL='mongodb://localhost:27017/logindb';
mongoose.connect(DB_URL);
const conn=mongoose.connection;
conn.once('open',() => {
   console.log('Successfully database connected');
})