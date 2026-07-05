const cron=require('node-cron');
const YahooFinance=require('yahoo-finance2').default;
const pool=require('../db/pool');
const sendEmail=require('./email.js');

const yf=new YahooFinance();
cron.schedule('*/1 * * * *',async()=>{
  try{
    const {rows}=await pool.query('select distinct symbol from watchlist');
  for(const symbl of rows){
    const {regularMarketPrice}=await yf.quote(`${symbl.symbol}`);
    

    await pool.query('update stocks set curr_price=$1 where symbol=$2',[regularMarketPrice,symbl.symbol]);

    
  }
  const alertTriggered=await pool.query(`select a.alert_id, u.email, a.stock_symbol,a.direction,a.price from alerts a join stocks s on a.stock_symbol=s.symbol join users u on a.user_id=u.user_id where ((a.direction='Above'and s.curr_price>a.price) or (a.direction='Below' and s.curr_price<a.price)) and a.is_triggered=false`);

  for(const row of alertTriggered.rows){
  try{
    await sendEmail(row.email,row.stock_symbol,row.direction,row.price);
    await pool.query('update alerts set is_triggered=true where alert_id=$1',[row.alert_id]);
  }catch(error){
    console.log(error.message);

  }   
    
  }
  
  }catch(error){
    console.log(error.message);
  }
  
})

