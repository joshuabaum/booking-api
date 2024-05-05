import mysql from "mysql2";
import bluebird from "bluebird";
require("dotenv").config();

var pool = mysql.createPool({
  host: process.env.MY_SQL_HOST,
  user: process.env.MY_SQL_USER,
  password: process.env.MY_SQL_PASS,
  Promise: bluebird,
});

export default pool;
