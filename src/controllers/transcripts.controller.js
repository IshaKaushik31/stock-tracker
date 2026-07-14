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

function classifyQuestion(question) {
  const q = question.toLowerCase();
  if (/summary|overview|highlight|key point|what happened|tell me about|recap/.test(q)) return 'summary';
  if (/revenue|profit|eps|earnings|guidance|capex|margin|how much|what was|figures|numbers|metric|growth rate/.test(q)) return 'metrics';
  if (/bullish|bearish|should i|buy|sell|invest|risk|concern|opportunity|outlook|valuation/.test(q)) return 'investment';
  if (/strategy|plan|roadmap|vision|initiative|focus|direction|priority|competition/.test(q)) return 'strategy';
  return 'default';
}

function buildPrompt(type, context, question) {
  const base = `Context:\n${context}\n\nQuestion: ${question}`;

  const systemPrompts = {
    summary: `You are a financial analyst. Summarize the key themes from this earnings transcript clearly and concisely. Structure your response with these sections: **Key Highlights**, **Financial Performance**, **Forward Guidance**, **Management Tone**. Only use information from the context.`,

    metrics: `You are a financial data analyst. Extract and present the specific financial metrics and numbers from the transcript. Present each figure clearly with any available context (e.g. YoY change, vs guidance). Do not interpret — just extract the facts accurately. If a number is not in the context, say so.`,

    investment: `You are a senior equity analyst. Analyze this earnings transcript with an investor's lens. Identify: **Bullish Developments**, **Risks & Concerns**, **Guidance Trends**, **Overall Investment Implication**. Back every point with specific evidence from the transcript.`,

    strategy: `You are a business strategist. Based on the management commentary in this transcript, explain the company's strategic direction, key initiatives, and competitive positioning. Quote specific management language where relevant. Only use information from the context.`,

    default: `You are a financial analyst assistant. Answer the question concisely and directly based only on the provided earnings transcript. Use bullet points where appropriate. Do not add information outside the context.`
  };

  return `${systemPrompts[type]}\n\n${base}`;
}

async function askQuestion(req, res) {
  try {
    const { id } = req.user;
    const trans_id = req.params.id;
    const { question } = req.body;

    const type = classifyQuestion(question);
    const limit = type === 'summary' ? 10 : 5;

    const questionVector = await embedText(question);

    const chunks = await pool.query(
      `SELECT chunk_text FROM chunks
       WHERE trans_id=$1
       ORDER BY chunk_vector <=> $2::vector
       LIMIT $3`,
      [trans_id, JSON.stringify(questionVector), limit]
    );

    const context = chunks.rows.map(r => r.chunk_text).join('\n\n');
    const prompt = buildPrompt(type, context, question);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }]
    });
    const answer = completion.choices[0].message.content;

    res.json({ answer });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


module.exports={uploadTranscript,getTranscripts,deleteTranscript,askQuestion};