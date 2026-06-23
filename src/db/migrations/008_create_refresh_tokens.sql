CREATE TABLE refresh_tokens(
  id SERIAl primary key,
  user_id int REFERENCES users(user_id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
