const YahooFinance=require('yahoo-finance2').default;
const yf=new YahooFinance();

async function fetchQuote(symbol) {
  if (symbol.endsWith('.NS')) {
    const bare = symbol.replace('.NS', '');
    const res = await fetch(`https://bharatstockapi.com/v1/stocks/${bare}`, {
      headers: { 'X-API-Key': process.env.BHARAT_STOCK_API_KEY }
    });
    const data = await res.json();
    const lp = data.latest_price;
    const priceChange = lp.close - lp.prev_close;
    const priceChangePct = (priceChange / lp.prev_close) * 100;
    return {
      curr_price: data.metrics.price,
      price_change: priceChange,
      price_change_pct: priceChangePct,
      week_52_high: data.metrics.high_52w,
      week_52_low: data.metrics.low_52w,
      week_52_change: data.metrics.return_1y / 100,
      volume: lp.volume,
      market_cap: data.market_cap
    };
  } else {
    const res = await fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`);
    const data = await res.json();
    const fw = data.fifty_two_week;
    return {
      curr_price: parseFloat(data.close),
      price_change: parseFloat(data.change),
      price_change_pct: parseFloat(data.percent_change),
      week_52_high: parseFloat(fw.high),
      week_52_low: parseFloat(fw.low),
      week_52_change: parseFloat(fw.high_change_percent) / 100,
      volume: parseInt(data.volume),
      market_cap: null
    };
  }
}

module.exports = { yf, fetchQuote };