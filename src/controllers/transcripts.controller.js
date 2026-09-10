require('dotenv').config();
const pool=require('../db/pool');
const { processTranscript, embedText } = require('../services/rag');

const OpenAI = require('openai');
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'


});





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



function buildPrompt(context, question) {
  const system = `You are an earnings call transcript analyzer. Answer strictly based on the 
provided context and conversation history — never use outside knowledge of 
the company, market, or industry, even if you know it.

If the context/history doesn't contain enough information to answer, respond:
"This isn't addressed in the provided transcript/context." Do not infer or estimate.

Structure your response based on the question type:
- Summary/overview: use clear section headers.
- Specific numbers/metrics: extract precisely, including YoY/QoQ change and 
  comparison to guidance where stated. Flag if chunks give conflicting figures.
- Investment analysis: present bullish signals, risks, and implications — 
  don't over-weight one side if the context is mixed.
- Strategy/management commentary: quote short, specific phrases (not full 
  paragraphs) and attribute them to the speaker when identifiable.`;

  return `${system}\n\nContext:\n${context}\n\nQuestion: ${question}`;
}

async function getChatHistory(req,res){
  try{
    const {id}=req.user;
    const trans_id=req.params.id;
    const chatHistory=await pool.query('select question,answer from qna where user_id=$1 and trans_id=$2',[id,trans_id]);
    res.json({chatObj:chatHistory.rows});

  }
  catch(error){
    res.json({message:error.message});

  }
}

async function askQuestion(req, res) {
  try {
    const { id } = req.user;
    const trans_id = req.params.id;
    const { question } = req.body;
    const result=await pool.query('insert into qna (trans_id,user_id,question)values($1,$2,$3) returning ques_id',[trans_id,id,question]);
    const {ques_id}=result.rows[0];
    
    const history = await pool.query(
      'SELECT question, answer FROM qna WHERE trans_id=$1 AND user_id=$2 AND answer != \'\' ORDER BY ques_id DESC LIMIT 5',
      [trans_id, id]
    );

    let queryToEmbed = question;

    if (history.rows.length > 0) {
      const rewriteResponse = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [{
          role: 'user',
          content: `Given this conversation history and a follow-up question, rewrite the question as a complete standalone question that can be understood without the history. If the question is already standalone, return it as-is.

    Conversation history:
    ${history.rows.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}

    Question: "${question}"

    Return only the rewritten question, nothing else.`
        }]
      });
      queryToEmbed = rewriteResponse.choices[0].message.content.trim();
    }

    console.log(queryToEmbed);




    

    const questionVector = await embedText(queryToEmbed);

    const chunks = await pool.query(
      `SELECT chunk_text FROM chunks
       WHERE trans_id=$1
       ORDER BY chunk_vector <=> $2::vector
       LIMIT $3`,
      [trans_id, JSON.stringify(questionVector), 7]
    );

    const context = chunks.rows.map(r => r.chunk_text).join('\n\n');
    const prompt = buildPrompt( context, queryToEmbed);

    

    

    const historyMessages = history.rows.slice().reverse().flatMap(r => [
  { role: 'user', content: r.question },
  { role: 'assistant', content: r.answer }
]);

const completion = await groq.chat.completions.create({
  model: 'openai/gpt-oss-20b',
  messages: [
    ...historyMessages,
    { role: 'user', content: prompt }
  ]
});


    const answer = completion.choices[0].message.content;
    
    await pool.query('update qna set answer=$1 where ques_id=$2',[answer,ques_id]);

    res.json({answer: answer});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


module.exports={uploadTranscript,getTranscripts,deleteTranscript,askQuestion,getChatHistory,buildPrompt,classifyQuestion};