const bcrypt=require('bcrypt');
const pool=require('../db/pool');
const jwt=require("jsonwebtoken");
require('dotenv').config();

async function register(req,res){
  try{
    const {username,email,password}=req.body;
    const hashPassword=await bcrypt.hash(password,10);
    await pool.query("INSERT INTO users(email,username,password_hash) VALUES($1,$2,$3)",[email,username,hashPassword]);
    const user=await pool.query('select user_id from users where email=$1',[email]);
    const accessToken=jwt.sign({
      id:user.rows[0].user_id
    },process.env.JWT_SECRET,
    {expiresIn:"15m"});

    const refreshToken=jwt.sign({
      id:user.rows[0].user_id
    },process.env.JWT_SECRET,
    {expiresIn:"1d"});
    await pool.query('insert into refresh_tokens(user_id,token) values($1,$2)',[user.rows[0].user_id,refreshToken]);

    
    res.cookie('refreshToken',refreshToken,{
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly:true,
    maxAge:1*24*60*60000
  });

  res.status(201).json({message:'Registration Successful',
      token:accessToken
    });
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

  const accessToken=jwt.sign({
    id:user.rows[0].user_id,},
    process.env.JWT_SECRET,
    {expiresIn:"15m"}
  );

  const refreshToken=jwt.sign(
    {user:user.rows[0].user_id},
    process.env.JWT_SECRET,
    {expiresIn:"1d"}
  )
  await pool.query('INSERT INTO refresh_tokens (user_id,token) VALUES ($1,$2)',[user.rows[0].user_id,refreshToken]);

  res.cookie('refreshToken',refreshToken,{
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly:true,
    maxAge:1*24*60*60000
  });

  res.json({message:'Successful login!',
   token:accessToken
  });
 } catch(error){
  res.status(500).json({message:error.message});
 }
  
}

async function refresh(req,res){
try{
  const refreshToken=req.cookies.refreshToken;
  if(!refreshToken) return res.status(401).json({message:'cookie not found'});
  const payload=jwt.verify(refreshToken,process.env.JWT_SECRET);
  //with jwt.verify() we check for 2 things: if the token has not expired and if it has not been tampered

  const tokenObj=await pool.query('SELECT token FROM refresh_tokens where token=$1',[refreshToken]);
  
  
  if(payload && tokenObj.rowCount!=0){
    const accessToken=jwt.sign({id:payload.user},process.env.JWT_SECRET,{expiresIn:"15m"});
    res.json({token:accessToken});
  }
  else{
    res.status(401).json({message:"invalid user"});
  }
}catch(error){
  res.status(400).json({message:'token expired'});
}  
  
  
}
async function logout(req,res){
 try{
  if(!req.cookies.refreshToken){
    return res.status(400).json({message:"token not found"});
  }
  res.clearCookie("refreshToken");
  await pool.query('DELETE FROM refresh_tokens WHERE token=$1',[req.cookies.refreshToken]);
  res.json({message:'logout successful'});
 }catch(error){
  res.status(500).json({message:error.message});
 } 
  
}
module.exports={register,login,refresh,logout};
