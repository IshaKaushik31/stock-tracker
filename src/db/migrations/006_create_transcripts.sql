create table transcripts(
  trans_id serial primary key,
  user_id int not null references users(user_id) on delete cascade,
  symbol varchar(10) not null references stocks(symbol) on delete cascade,
  quarter varchar(2) check(quarter in('Q1','Q2','Q3','Q4')),
  year int not null,
  uploaded_at timestamp default now()
);