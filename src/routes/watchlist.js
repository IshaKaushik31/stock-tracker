const {add}=require('../controllers/watchlist.controller.js');
const {verifyToken}=require('../middleware/auth.middleware.js');
const express=require('express');
const router=express.Router();

router.post('/',verifyToken,add);
module.exports=router;