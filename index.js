const express=require('express');
const app=express();
app.use(express.json());
const port=3000;
const authRouter=require('./src/routes/auth.js');
const watchlistRouter=require('./src/routes/watchlist.js');
const alertsRouter=require('./src/routes/alerts.js');
const holdingsRouter=require('./src/routes/holding.js');
const transcriptsRouter=require('./src/routes/transcripts.js');
const cookieParser=require('cookie-parser');
require('./src/services/cron');
app.use(cookieParser());

app.use('/auth',authRouter);
app.use('/watchlist',watchlistRouter);
app.use('/alerts',alertsRouter);
app.use('/holdings',holdingsRouter);
app.use('/transcripts',transcriptsRouter);


app.get('/',(req,res)=>{
  res.send('Hello World!');
});

app.listen(port,()=>{
  console.log('server up and running');
});

