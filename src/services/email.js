const {Resend}=require('resend');
require('dotenv').config();
const resend=new Resend(process.env.RESEND_API_KEY);


async function sendEmail(user_email,stock_symbol,price,direction){

  await resend.emails.send({
    from:'onboarding@resend.dev',
    to:[user_email],
    subject: `Price Alert Triggered: ${stock_symbol}`,
    html: `<p>Your alert for <strong>${stock_symbol}</strong> has been triggered.</p>
    <p>The price has gone <strong>${direction}</strong> your target of <strong>${price}</strong>.</p>`

  });
}


  



module.exports=sendEmail;