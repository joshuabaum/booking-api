import {
  QueryError,
  RowDataPacket,
  Connection,
  Pool,
  ResultSetHeader,
} from "mysql2";
import { executeQuery } from "./database_utils";
import users_data from "./sample_data/users_sample_data";
import rest_data from "./sample_data/restaurant_sample_data";

function createTables(db: Connection): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const create_users_table =
        "CREATE TABLE IF NOT EXISTS users(user_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), diet_restrictions SET('Vegan', 'Gluten Free', 'Vegetarian', 'Paleo'), reservation_ids JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
      await executeQuery(
        db,
        create_users_table,
        "failed to create users table: ",
      );
      console.log("Created users table.");

      const create_reservations_table =
        "CREATE TABLE IF NOT EXISTS reservations(reservation_id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT, num_seats INT, start_time TIMESTAMP, user_ids JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
      await executeQuery(
        db,
        create_reservations_table,
        "failed to create reservations table: ",
      );
      console.log("Created reservations table.");

      const create_restaurants_table =
        "CREATE TABLE IF NOT EXISTS restaurants(restaurant_id INT AUTO_INCREMENT PRIMARY KEY, name VarChar(255), diet_support SET('Vegan', 'Gluten Free', 'Vegetarian', 'Paleo'), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
      await executeQuery(
        db,
        create_restaurants_table,
        "failed to create restaurants table: ",
      );
      console.log("Created restaurants table.");

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function clearTables(db: Connection): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await executeQuery(
        db,
        "TRUNCATE TABLE users",
        "failed to truncate user table",
      );
      console.log("cleared users table.");
      await executeQuery(
        db,
        "TRUNCATE TABLE reservations",
        "failed to truncate reservations table",
      );
      console.log("cleared reservations table.");
      await executeQuery(
        db,
        "TRUNCATE TABLE restaurants",
        "failed to truncate restaurants table",
      );
      console.log("cleared restaurants table.");
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function populateUsers(db: Connection): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const insertString =
      "INSERT INTO users (name, diet_restrictions, reservation_ids) VALUES ?";
    const valuesToInsert = users_data.data.map((user: any) => [
      user.name,
      user.diet.toString(),
      "{}",
    ]);

    executeQuery(
      db,
      insertString,
      "failed to insert records to users table: ",
      valuesToInsert,
    )
      .then((res: ResultSetHeader) => {
        console.log("Added " + res.affectedRows + " records to users table");
        resolve();
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

/**
 * Populates the restaurants table with sample data and returns a list of the Unique ID for each inserted restaurant.
 *
 * @returns The list of ids for for all inserted restaurant.
 */
function populateRestaurants(db: Connection): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const insertString =
      "INSERT INTO restaurants (name, diet_support) VALUES ?";
    const valuesToInsert = rest_data.data.map((rest) => [
      rest.name,
      rest.supported_diet.toString(),
    ]);
    executeQuery(
      db,
      insertString,
      "failed to insert records to restaurants table: ",
      valuesToInsert,
    )
      .then((res: ResultSetHeader) => {
        console.log(
          "Added " + res.affectedRows + " records to restaurants table",
        );
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

function getRestaurantIdNameMapping(db: Connection): Promise<RowDataPacket[]> {
  return new Promise<RowDataPacket[]>((resolve, reject) => {
    db.query(
      "SELECT restaurant_id as id, name as name from restaurants",
      (err: QueryError, res: RowDataPacket) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(JSON.parse(JSON.stringify(res)));
        }
      },
    );
  });
}

/**
 * Populates the restaurants table with sample data and returns a list of the Unique ID for each inserted restaurant.
 *
 * @returns The list of ids for for all inserted restaurant.
 */
async function populateReservations(db: Connection): Promise<void> {
  const restMappings: RowDataPacket[] = await getRestaurantIdNameMapping(db);

  const valuesToInsert: any[] = [];
  for (var row of restMappings) {
    const tables: Table[] = getTables(row.name);
    for (var table of tables)
      for (var num_seat of table.num_seats) {
        valuesToInsert.push([
          row.id,
          num_seat,
          new Date(parseInt(table.time) * 1000),
          "{}",
        ]);
      }
  }

  const insertString =
    "INSERT INTO reservations(restaurant_id, num_seats, start_time, user_ids) VALUES ?";

  return new Promise<void>((resolve, reject) => {
    executeQuery(
      db,
      insertString,
      "failed to insert records to reservations table: ",
      valuesToInsert,
    )
      .then((res: ResultSetHeader) => {
        console.log(
          "Added " + res.affectedRows + " records to reservations table",
        );
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

type Table = { time: string; num_seats: number[] };
/**
 * Returns the list of tables for the restaurant in the sample data with the given @param name
 *
 *
 * @param name the name of the restaurant to find tables for
 * @returns The list of available tables for the restaurant.
 */
function getTables(name: string): Table[] {
  var result = rest_data.data.find((data_item) => data_item.name === name);
  if (undefined === result) {
    // I want this to yell at me if it fails for easy debugging.
    throw "Restaurant name can't be found in sample data";
  }
  return result.reservations;
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

    await createTables(connection);
    await clearTables(connection);

    // All insertions must come after creating and clearing the tables
    populateUsers(connection);
    await populateRestaurants(connection);
    // populateReservations depends on records inserted in populateRestaurants
    populateReservations(connection).catch((err) =>
      console.log("ERROR: " + err),
    );

    connection.release();
  });
}
