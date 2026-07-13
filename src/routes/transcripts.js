const express=require('express');
const router=express.Router();
const {verifyToken}=require('../middleware/auth.middleware.js');
const {uploadTranscript,getTranscripts,deleteTranscript,askQuestion}=require('../controllers/transcripts.controller.js');
const upload=require('../middleware/upload.middleware.js');

router.post('/',verifyToken,upload.single('pdf'),uploadTranscript);
router.get('/',verifyToken,getTranscripts);
router.delete('/:id',verifyToken,deleteTranscript);
router.post('/:id/question',verifyToken,askQuestion);

module.exports=router;
