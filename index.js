const express=require('express');
const app=express();
app.use(express.json());
const port=3000;
const authRouter=require('./src/routes/auth.js');
const cookieParser=require('cookie-parser');
app.use(cookieParser());

app.use('/auth',authRouter);

app.get('/',(req,res)=>{
  res.send('Hello World!');
});

app.listen(port,()=>{
  console.log('server up and running');
});

