const jwt=require("jsonwebtoken");
require('dotenv').config();
function verifyToken(req,res,next){
  try{
    const token=req.headers.authorization.split(" ")[1];
    const payload=jwt.verify(token,process.env.JWT_SECRET);
    req.user=payload;
    next();

  }catch(error){
    res.status(401).json({message:error.message});

  }
  
  
}
module.exports={verifyToken};