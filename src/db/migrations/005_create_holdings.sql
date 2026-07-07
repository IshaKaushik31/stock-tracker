create table holdings(
  holding_id serial primary key,
  user_id int references users(user_id)on delete cascade not null,
  symbol varchar(10) references stocks(symbol)on delete cascade not null,
  price_bought float not null,
  quantity float not null,
  created_at timestamp default now()
)