const {getStockDetail}=require('../controllers/stocks.controller.js');
const {verifyToken}=require('../middleware/auth.middleware.js');
const express=require('express');
const router=express.Router();

router.get('/:symbol',verifyToken,getStockDetail);

module.exports=router;
