const bcrypt=require('bcrypt');
const pool=require('../db/pool');
async function register(req,res){
  try{
    const {username,email,password}=req.body;
    const hashPassword=await bcrypt.hash(password,10);
    await pool.query("INSERT INTO users(email,username,password_hash) VALUES($1,$2,$3)",[email,username,hashPassword]);
    res.status(201).json({message:'Registration Successful'});
  }catch(error){
    res.status(500).json({message:'Registration failed',error:error.message});
  }
  

}
module.exports={register};
