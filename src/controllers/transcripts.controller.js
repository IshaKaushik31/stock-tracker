const pool=require('../db/pool');
const { processTranscript, embedText, genAI } = require('../services/rag');


async function uploadTranscript(req,res){
try{
  const {id}=req.user;
  const {symbol,year,quarter}=req.body;
  const result=await pool.query('insert into transcripts (user_id,symbol,quarter,year) values ($1,$2,$3,$4) returning trans_id',[id,symbol,quarter,year]);
  const {trans_id}=result.rows[0];
  await processTranscript(req.file.buffer,trans_id);
  res.json({message:'pdf uploaded successfully!!'});
}catch(error){
  res.status(500).json({message:error.message});
}  
  
}

async function getTranscripts(req, res) {
  try {
    const { id } = req.user;
    const result = await pool.query(
      'SELECT trans_id, symbol, quarter, year, uploaded_at FROM transcripts WHERE user_id=$1',
      [id]
    );
    res.json({ transcripts: result.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function deleteTranscript(req, res) {
  try {
    const { id } = req.user;
    const trans_id = req.params.id;
    await pool.query(
      'DELETE FROM transcripts WHERE trans_id=$1 AND user_id=$2',
      [trans_id, id]
    );
    res.json({ message: 'Transcript deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function askQuestion(req, res) {
  try {
    const { id } = req.user;
    const trans_id = req.params.id;
    const { question } = req.body;

    const questionVector = await embedText(question);

    const chunks = await pool.query(
      `SELECT chunk_text FROM chunks 
       WHERE trans_id=$1 
       ORDER BY chunk_vector <=> $2::vector 
       LIMIT 5`,
      [trans_id, JSON.stringify(questionVector)]
    );

    const context = chunks.rows.map(r => r.chunk_text).join('\n\n');

    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

    const prompt = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer based on the context above.`;
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


module.exports={uploadTranscript,getTranscripts,deleteTranscript,askQuestion};