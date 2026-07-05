const express=require('express');
const router=express.Router();
const {verifyToken}=require('../middleware/auth.middleware.js');
const {createAlerts,seeAlerts,deleteAlert,editAlert}=require('../controllers/alerts.controller.js');

router.post('/',verifyToken,createAlerts);
router.get('/',verifyToken,seeAlerts);
router.delete('/:alert_id',verifyToken,deleteAlert);
router.patch('/',verifyToken,editAlert);

module.exports=router;