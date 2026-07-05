create table alerts(
  alert_id serial primary key,
  user_id int references users(user_id)on delete cascade not null ,
  stock_symbol varchar(10) references stocks(symbol)on delete cascade not null,
  price float not null,
  direction varchar(10) not null check(direction in ('Above','Below')),
  is_triggered boolean default false not null,
  created_at timestamp default now()
);