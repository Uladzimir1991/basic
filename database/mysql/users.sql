create database if not exists main;
use main;
drop table if exists users;
create table users (
  id int auto_increment primary key,
  nickname varchar(128)
);
