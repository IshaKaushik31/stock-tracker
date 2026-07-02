const cron=require('node-cron');
const YahooFinance=require('yahoo-finance2').default;
const pool=require('../db/pool');

const yf=new YahooFinance();
cron.schedule('*/1 * * * *',async()=>{
  try{
    const {rows}=await pool.query('select distinct symbol from watchlist');
  for(const symbl of rows){
    const {regularMarketPrice}=await yf.quote(`${symbl.symbol}`);
    // const result=await yf.quote(`${symbl.symbol}`);
    // console.log(symbl.symbol);
    // console.log(result);

    await pool.query('update stocks set curr_price=$1 where symbol=$2',[regularMarketPrice,symbl.symbol]);
  }
  }catch(error){
    console.log(error.message);
  }
  
})

