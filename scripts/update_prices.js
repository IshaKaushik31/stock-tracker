require('dotenv').config();
const YahooFinance = require('yahoo-finance2').default;
const { Pool } = require('pg');
const sendEmail=require('../src/services/email.js');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const yf = new YahooFinance();

async function run() {
  try {
    const { rows } = await pool.query('select distinct symbol from stocks');
    for (const row of rows) {
      const { regularMarketPrice } = await yf.quote(row.symbol);
      await pool.query('update stocks set curr_price=$1 where symbol=$2', [regularMarketPrice, row.symbol]);
    }

    const alerts = await pool.query(
      `select a.alert_id, u.email, a.stock_symbol, a.direction, a.price
       from alerts a
       join stocks s on a.stock_symbol = s.symbol
       join users u on a.user_id = u.user_id
       where ((a.direction='Above' and s.curr_price > a.price) or (a.direction='Below' and s.curr_price < a.price))
       and a.is_triggered = false`
    );

    for (const row of alerts.rows) {
      await sendEmail(row.email, row.stock_symbol, row.price, row.direction);

      await pool.query('update alerts set is_triggered=true where alert_id=$1', [row.alert_id]);
    }

    console.log('Prices updated successfully');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
