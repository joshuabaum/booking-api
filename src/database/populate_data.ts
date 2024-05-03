import { Connection, Pool } from "mysql2";
import users_data from "./sample_data/users_sample_data";

function createTables(db: Connection): void {
  const create_users_table =
    "CREATE TABLE users(user_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), diet_restrictions SET('Vegan', 'Gluten Free', 'Vegetarian', 'Paleo'), reservation_ids JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
  db.query(create_users_table, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Created users table.");
    }
  });

  const create_reservations_table =
    "CREATE TABLE IF NOT EXISTS reservations(reservation_id INT AUTO_INCREMENT PRIMARY KEY, restaurants_id INT, num_seats INT, start_time TIMESTAMP, user_ids JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
  db.query(create_reservations_table, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Created reservations table.");
    }
  });

  const create_restaurants_table =
    "CREATE TABLE IF NOT EXISTS  restaurants(restaurants_id INT AUTO_INCREMENT PRIMARY KEY, diet_support JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
  db.query(create_restaurants_table, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Created restaurants table.");
    }
  });
}

function populateUsers(db: Connection): void {
  db.query(
    "INSERT INTO users (name, diet_restrictions, reservation_ids) VALUES ('test', '(Vegan,Paleo)', '{}')",
    (err, res) => {
      console.log(err, res);
    },
  );
  const insert_string =
    "INSERT INTO users (name, diet_restrictions, reservation_ids) VALUES (?, ?, ?)";
  for (var user of users_data.data) {
    db.query(
      insert_string,
      [user.name, user.diet.toString(), "{}"],
      (err, res) => {
        console.log(err, res);
      },
    );
  }
}

export default async function createAndPopulateDb(pool: Pool) {
  pool.getConnection(async (err, connection) => {
    if (err) {
      throw err;
    } else {
      console.log("MySQL connected successfully");
    }

    connection.query(
      "CREATE DATABASE IF NOT EXISTS booking_api",
      function (err, result) {
        if (err) {
          throw err;
        } else {
          console.log("Database created");
        }
      },
    );
    connection.changeUser({ database: "booking_api" });
    createTables(connection);
    populateUsers(connection);

    connection.release();
  });
}
