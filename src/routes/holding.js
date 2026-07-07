const{showPnL,editHolding,deleteHolding,getHolding,addHolding}=require('../controllers/holding.controller.js');
const {verifyToken}=require('../middleware/auth.middleware.js');
const express=require('express');
const router=express.Router();

router.post('/',verifyToken,addHolding);
router.get('/pnl',verifyToken,showPnL);
router.get('/',verifyToken,getHolding);
router.delete('/:id',verifyToken,deleteHolding);
router.patch('/:id',verifyToken,editHolding);

module.exports=router;
