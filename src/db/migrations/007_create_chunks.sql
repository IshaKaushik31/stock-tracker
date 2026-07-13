CREATE TABLE chunks (
  id SERIAL PRIMARY KEY,
  trans_id INT REFERENCES transcripts(trans_id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_vector vector(3072),
  section VARCHAR(255),
  chunk_index INT NOT NULL
);


