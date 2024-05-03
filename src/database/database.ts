import mysql from "mysql2";
import { Connection } from "mysql2";
import bluebird from "bluebird";
import { User, Restaurant, Reservation } from "./datamodels";

// In real environemnt would use env variables to store sensitive data.
var pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "test",
  Promise: bluebird,
});

export default pool;
