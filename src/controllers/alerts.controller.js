const pool=require('../db/pool');

async function createAlerts(req,res){
try{
  const {id}=req.user;
  const {symbol,price,direction}=req.body;
  await pool.query('insert into alerts (user_id,stock_symbol,price,direction) values($1,$2,$3,$4)',[id,symbol,price,direction]);
  res.json({message:'alert added successfully!!'});
}catch(error){
  res.status(500).json({message:error.message});
} 
}

async function seeAlerts(req,res){
try{
  const {id}=req.user;
  const alerts=await pool.query('select * from alerts where user_id=$1',[id]);
  res.json({alerts:alerts.rows});
}catch(error){
  res.status(500).json({message:error.message});
}
}

async function deleteAlert(req,res){
try{
  const {id}=req.user;
  const alertId=req.params.alert_id;
  await pool.query('delete from alerts where user_id=$1 and alert_id=$2',[id,alertId]);
  res.json({message:'deleted successfully!!'});
} catch(error){
  res.status(500).json({message:error.message});
} 
}

async function editAlert(req,res){
try{
  const{id}=req.user;
  const {symbol,price,direction,alert_id}=req.body;
  await pool.query('update alerts set price=$1 ,stock_symbol=$2, direction=$3 where user_id=$4 and alert_id=$5',[price,symbol,direction,id,alert_id]);
  res.json({message:'updated successfully!!'});
}catch(error){
  res.status(500).json({message:error.message});
}  
}
module.exports={createAlerts,seeAlerts,deleteAlert,editAlert};