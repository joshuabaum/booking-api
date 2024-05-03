import express from "express";
import dbPool from "../database/database";

const router = express.Router();

// TODO: CreateReservationResponse type
type CreateReservationResponse = String;

router.get<{}, CreateReservationResponse>("/", async (req, res) => {
  // TODO: CreateReservationResponse logic. For now this just returns all entries in the user table to verify setup.
  dbPool.getConnection(async (err, connection) => {
    if (err) {
      throw err;
    } else {
      console.log("MySQL connected successfully");
    }
    connection.query("SELECT * FROM users", (err: any, rows: any) => {
      if (err) {
        console.log(err);
        res.send("failure");
      } else {
        console.log(rows);
        res.send(rows);
      }
    });
  });
});

export default router;
