const {add,deleteStock,seeWatchlist}=require('../controllers/watchlist.controller.js');
const {verifyToken}=require('../middleware/auth.middleware.js');
const express=require('express');
const router=express.Router();

router.post('/',verifyToken,add);
router.delete('/:symbol',verifyToken,deleteStock);
router.get('/',verifyToken,seeWatchlist);
module.exports=router;