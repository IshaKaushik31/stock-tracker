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
module.exports={add};