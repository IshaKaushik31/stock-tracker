create table qna(
  ques_id serial primary key,
  trans_id int references transcripts(trans_id) on delete cascade,
  user_id int references users(user_id) on delete cascade,
  question text not null,
  answer text default '',
  created_at timestamp default now()
);
