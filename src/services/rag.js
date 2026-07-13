const pdfParse = require('pdf-parse');


const pool=require('../db/pool');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const sbd = require('sbd');

async function extractText(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

// data.text — the data object has multiple properties (numpages, info, metadata, etc.) but you only need data.text — a single string containing all the text from the PDF, page by page.

// function chunkText(text, chunkSize = 1000, overlap = 200) {
//   const chunks = [];
//   let start = 0;
//   while (start < text.length) {
//     const end = start + chunkSize;
//     chunks.push(text.slice(start, end));
//     start += chunkSize - overlap;
//   }
//   return chunks;
// }

function chunkText(text, maxSize = 1000) {
  const sectionRegex = /^([A-Z][A-Z\s\-]{5,}|[A-Z\s]+:|.{3,60}:\s*)$/m;

  const lines = text.split('\n');
  
  const sections = [];
  let currentSection = 'unknown';
  let currentText = '';

  for (const line of lines) {
    if (sectionRegex.test(line.trim()) && line.trim().length > 0) {
      if (currentText.trim()) {
        sections.push({ section: currentSection, text: currentText.trim() });
      }
      currentSection = line.trim();
      currentText = '';
    } else {
      currentText += line + '\n';
    }
  }
  if (currentText.trim()) {
    sections.push({ section: currentSection, text: currentText.trim() });
  }

  const chunks = [];
  for (const { section, text } of sections) {
    if (text.length <= maxSize) {
      chunks.push({ text, section });
    } else {
      const paragraphs = text.split(/\n\n+|\n(?=[A-Z])/).filter(p => p.trim().length > 0);

      let buffer = '';
      for (const para of paragraphs) {
        if ((buffer + para).length <= maxSize) {
          buffer += para + '\n\n';
        } else {
          if (buffer.trim()) chunks.push({ text: buffer.trim(), section });
          if (para.length <= maxSize) {
            buffer = para + '\n\n';
          } else {
            
const sentences = sbd.sentences(para, { newline_boundaries: true });

            let sentBuffer = '';
            for (const sentence of sentences) {
              if ((sentBuffer + sentence).length <= maxSize) {
                sentBuffer += sentence + ' ';
              } else {
                if (sentBuffer.trim()) chunks.push({ text: sentBuffer.trim(), section });
                sentBuffer = sentence + ' ';
              }
            }
            if (sentBuffer.trim()) chunks.push({ text: sentBuffer.trim(), section });
            buffer = '';
          }
        }
      }
      if (buffer.trim()) chunks.push({ text: buffer.trim(), section });
    }
  }

  const OVERLAP = 150;
const overlappedChunks = chunks.map((chunk, i) => {
  if (i === 0) return chunk;
  const prevText = chunks[i - 1].text;
  const overlapText = prevText.slice(-OVERLAP);
  return { ...chunk, text: overlapText + ' ' + chunk.text };
});

return overlappedChunks;

}




const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'models/gemini-embedding-001' });




async function embedText(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function processTranscript(buffer,trans_id){
  const text=await extractText(buffer);
  // const chunkList=chunkText(text);
  // for(const chunk of chunkList){
  //   const vector=await embedText(chunk);
  //   await pool.query('insert into chunks (trans_id,chunk_text,chunk_vector) values($1,$2,$3::vector)',[trans_id,chunk,JSON.stringify(vector)]);

  // }
  const chunkList = chunkText(text);
  for (let i = 0; i < chunkList.length; i++) {
    const { text: chunkText, section } = chunkList[i];
    const vector = await embedText(chunkText);
    await pool.query(
      'INSERT INTO chunks (trans_id, chunk_text, chunk_vector, section, chunk_index) VALUES ($1,$2,$3::vector,$4,$5)',
      [trans_id, chunkText, JSON.stringify(vector), section, i]
    );
  }



}

module.exports={processTranscript,embedText,genAI};

