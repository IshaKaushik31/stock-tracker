const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db/pool');
require('dotenv').config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV === 'production'
  ? 'https://stock-tracker-o216.onrender.com/auth/google/callback'
  : 'http://localhost:3000/auth/google/callback'

}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const googleId = profile.id;

    const existing = await pool.query('SELECT * FROM users WHERE google_id=$1', [googleId]);
    if (existing.rows.length > 0) {
      return done(null, existing.rows[0]);
    }

    const byEmail = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (byEmail.rows.length > 0) {
      await pool.query('UPDATE users SET google_id=$1 WHERE email=$2', [googleId, email]);
      return done(null, byEmail.rows[0]);
    }

    const newUser = await pool.query(
      'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING *',
      [email, googleId]
    );
    return done(null, newUser.rows[0]);

  } catch (error) {
    return done(error);
  }
}));



module.exports = passport;
