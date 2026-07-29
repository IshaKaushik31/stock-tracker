const {register,login,refresh,logout}=require('../controllers/auth.controller.js');
const express=require('express');
const router=express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register',register);

router.post('/login',login);

router.post('/refresh',refresh);

router.post('/logout',logout);

router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const accessToken = jwt.sign({ id: req.user.user_id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ user: req.user.user_id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [req.user.user_id, refreshToken]);

    res.cookie('refreshToken', refreshToken, {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1 * 24 * 60 * 60000
    });

    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${accessToken}`);
  }
);


    



module.exports=router;