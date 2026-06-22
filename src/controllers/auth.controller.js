const bcrypt=require('bcrypt');
const pool=require('../db/pool');
const jwt=require("jsonwebtoken");
require('dotenv').config();

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

async function login(req,res){
 try{
  const {email,password}=req.body;
  const user=await pool.query('SELECT * FROM users where email = $1',[email]);
  if(user.rowCount==0){
     return res.status(404).json({message:'user not found'});
  }
  const hashPassword=user.rows[0].password_hash;
  const userFound=await bcrypt.compare(password,hashPassword);
  if(!userFound){
    return res.status(401).json({message:'Incorrect password'})
  }

  const token=jwt.sign({
    id:user.rows[0].user_id,},
    process.env.JWT_SECRET,
    {expiresIn:"1d"}
  );

  res.json({message:'Successful login!',
   token:token
  });
 } catch(error){
  res.status(500).json({message:'login failed'});
 }
  
}
module.exports={register,login};
