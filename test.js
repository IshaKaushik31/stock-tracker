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
const { HfInference } = require('@huggingface/inference');

async function test() {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: 'test sentence'
  });
  console.log(result);
  console.log('dimensions:', result.length);
}
test();

