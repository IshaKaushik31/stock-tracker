const {getStockDetail,getPriceHistory}=require('../controllers/stocks.controller.js');
const {getNews}=require('../controllers/news.controller.js');
const {verifyToken}=require('../middleware/auth.middleware.js');
const express=require('express');
const router=express.Router();

router.get('/:symbol',verifyToken,getStockDetail);
router.get('/:symbol/news',verifyToken,getNews);
router.get('/:symbol/history',verifyToken,getPriceHistory);

module.exports=router;
