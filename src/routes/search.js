const {searchSymbol}=require('../controllers/search.controller.js');
const express=require('express');
const router=express.Router();
const {verifyToken}=require('../middleware/auth.middleware.js');

router.get('/',verifyToken,searchSymbol);

module.exports=router;