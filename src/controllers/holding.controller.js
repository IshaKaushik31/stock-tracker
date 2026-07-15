const pool=require('../db/pool');

async function addHolding(req,res){
try{
  const {id}=req.user;
  const {symbol,price_bought,quantity}=req.body;
  await pool.query('insert into stocks(symbol) values($1)on conflict do nothing',[symbol]);
  await pool.query('insert into holdings (user_id,symbol,price_bought,quantity) values($1,$2,$3,$4)',[id,symbol,price_bought,quantity]);
  res.json({message:'holding added successfully'});
} catch(error){
  res.status(500).json({message:error.message});
} 
}

async function getHolding(req,res){
try{
  const {id}=req.user;
  const holdings=await pool.query('select h.holding_id,h.symbol,h.price_bought,h.quantity,s.curr_price from holdings h join stocks s on h.symbol=s.symbol  where user_id=$1',[id]);
  res.json({
    holding:holdings.rows
  });

} catch(error){
  res.status(500).json({message:error.message});

} 

}

async function deleteHolding(req,res){
try{
  const {id}=req.user;
  const holding_id=req.params.id;
  await pool.query('delete from holdings where user_id=$1 and holding_id=$2',[id,holding_id]);
  res.json({ message: 'deleted successfully' });


}catch(error){
  res.status(500).json({message:error.message});

}
}
async function editHolding(req,res){
try{
  const {id}=req.user;
  const holding_id=req.params.id;
  const {symbol,price_bought,quantity}=req.body;
  await pool.query('update holdings set symbol=$1,price_bought=$2,quantity=$3 where user_id=$4 and holding_id=$5',[symbol,price_bought,quantity,id,holding_id]);
  res.json({message:'edited successfully'});
}catch(error){
  res.status(500).json({message:error.message});

}  
}
async function showPnL(req, res) {
  try {
    const { id } = req.user;
    let result;

    if (req.query.holding_id) {
      result = await pool.query(
        `SELECT h.holding_id,
                h.symbol,
                h.price_bought,
                h.quantity,
                s.curr_price,
                (s.curr_price - h.price_bought) * h.quantity AS pnl
         FROM holdings h
         JOIN stocks s ON h.symbol = s.symbol
         WHERE h.user_id = $1
           AND h.holding_id = $2`,
        [id, req.query.holding_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Holding not found." });
      }

      return res.status(200).json(result.rows[0]);

    } else if (req.query.symbol) {

      result = await pool.query(
        `SELECT 
  h.symbol,
  SUM(h.quantity) AS total_quantity,
  SUM(h.price_bought * h.quantity) / SUM(h.quantity) AS avg_price_bought,
  s.curr_price,
  SUM((s.curr_price - h.price_bought) * h.quantity) AS total_pnl
FROM holdings h
JOIN stocks s ON h.symbol = s.symbol
WHERE h.user_id = $1 AND h.symbol = $2
GROUP BY h.symbol, s.curr_price
`,
        [id, req.query.symbol]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "No holdings found for this stock." });
      }

      return res.status(200).json(result.rows);

    } else {

      result = await pool.query(
        `SELECT SUM((s.curr_price - h.price_bought) * h.quantity) AS total_pnl
FROM holdings h
JOIN stocks s ON h.symbol = s.symbol
WHERE h.user_id = $1
`,
        [id]
      );

      return res.status(200).json(result.rows);
    }

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
  
module.exports={showPnL,editHolding,deleteHolding,getHolding,addHolding};