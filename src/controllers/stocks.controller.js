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

async function getPriceHistory(req, res) {
  try {
    const { symbol } = req.params;
    const range = req.query.range || '1M';

    const sliceMap = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365 };
    const sliceSize = sliceMap[range] || 30;

    const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);

    if (symbol.endsWith('.NS')) {
      const bare = symbol.replace('.NS', '');
      const apiRes = await fetch(
        `https://bharatstockapi.com/v1/stocks/${bare}/prices?from=${from}&to=${to}&page_size=365&exchange=NSE`,
        { headers: { 'X-API-Key': process.env.BHARAT_STOCK_API_KEY } }
      );
      const data = await apiRes.json();
      const history = (data.data || []).map(d => ({
        date: d.trade_date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      })).reverse().slice(-sliceSize);
      return res.json({ history });

    } else {
      const apiRes = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=365&apikey=${process.env.TWELVE_DATA_API_KEY}`
      );
      const data = await apiRes.json();
      const history = (data.values || []).map(d => ({
        date: d.datetime,
        open: parseFloat(d.open),
        high: parseFloat(d.high),
        low: parseFloat(d.low),
        close: parseFloat(d.close),
        volume: parseInt(d.volume)
      })).reverse().slice(-sliceSize);
      return res.json({ history });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { getStockDetail, getPriceHistory }