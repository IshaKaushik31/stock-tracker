// const bcrypt=require('bcrypt');
// async function test(){
//   const password="343@^123isha";
//   const hash= await bcrypt.hash(password,10);
//   const isSame= await bcrypt.compare('isha',hash);
//   console.log({
//     password,
//     hash,
//     isSame
//   });
// }
// test();

// const YahooFinance=require('yahoo-finance2').default;
// const yf= new YahooFinance();
// async function test(){
//   const result=await yf.quote('AAPL');
//   console.log(result);
//   console.log(result.regularMarketPrice);
// }
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );
  const data = await response.json();
  const embeddingModels = data.models.filter(m => m.supportedGenerationMethods?.includes('embedContent'));
  console.log(embeddingModels.map(m => m.name));

  const generateModels = data.models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));
console.log(generateModels.map(m => m.name));

}
test();

