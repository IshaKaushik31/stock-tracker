const pool=require('../db/pool');
const {fetchQuote}=require('../config/yahooFinance');

 async function getStockDetail(req,res){
 try{
  const {symbol}=req.params;

  const data=await pool.query('select symbol, curr_price,price_change,price_change_pct,week_52_high,week_52_low,week_52_change,volume,market_cap from stocks where symbol=$1',[symbol]);

  if(data.rows.length==0){
    const quote = await fetchQuote(symbol);
    await pool.query('insert into stocks values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[symbol,quote.curr_price,quote.price_change,quote.price_change_pct,quote.week_52_high,quote.week_52_low,quote.week_52_change,quote.volume,quote.market_cap,quote.company_name]);
    return res.json(quote);
  }

  res.json(data.rows[0]);
 }catch(error){
  res.status(500).json({message:error.message});
 } 
  

}

module.exports={getStockDetail}