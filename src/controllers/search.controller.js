const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();
async function searchSymbol(req,res){
  try{
    const query=req.query.q;
    const result= await yf.search(query);
    const quotes = result.quotes
      .filter(q => q.quoteType === 'EQUITY')
      .map(q => ({ symbol: q.symbol, name: q.shortname || q.longname || q.symbol }));

    res.json({result:quotes});
  }catch(error){
    res.status(500).json({message:error.message});
  }
  

}
module.exports={searchSymbol};