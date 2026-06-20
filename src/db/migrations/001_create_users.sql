create table users(
  user_id serial primary key,
  email varchar(255) unique not null,
  username varchar(50) not null,
  password_hash text not null,
  joined_at timestamp default now() 
);
