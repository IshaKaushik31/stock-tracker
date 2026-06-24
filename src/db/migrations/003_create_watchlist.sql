create table watchlist(
  user_id int not null references users(user_id) on delete cascade,
  symbol varchar(10) not null references stocks(symbol) on delete cascade,
  added_at timestamp default now(),
  primary key(user_id,symbol)
);