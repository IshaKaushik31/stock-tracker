const pool=require('../db/pool');

async function add(req,res){
try{
  const {symbol}=req.body;
  const id=req.user.id;
  
  await pool.query('insert into stocks(symbol) values($1) on conflict do nothing',[symbol]);
  
  await pool.query('insert into watchlist(user_id,symbol) values($1,$2) ',[id,symbol]);

  res.json({message:'stock added successfully!!'});
}catch(error){
  res.status(500).json({message:error.message});
}  
}

async function deleteStock(req,res){
try{
  const {id}=req.user;
  const symbl=req.params.symbol;
  await pool.query('DELETE FROM watchlist WHERE symbol=$1 AND user_id=$2',[symbl,id]);
  res.json({message:'stock deleted successfully!!'});

}catch(error){
  res.status(400).json({message:error.message});
}  
  

}

async function seeWatchlist(req,res){
try{
  const {id}=req.user;
  const stocks=await pool.query('SELECT w.symbol, s.curr_price FROM watchlist as w INNER JOIN stocks as s ON s.symbol=w.symbol WHERE w.user_id=$1',[id]);
  res.json({stocks:stocks.rows})
}catch(error){
  res.json({message:error.message});
}  
  
}


module.exports={add,deleteStock,seeWatchlist};