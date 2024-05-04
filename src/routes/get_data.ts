import express from "express";
import dbPool from "../database/database";
import { executeQuery } from "../database/database_utils";
import { ResultSetHeader } from "mysql2";

// FOR LOCAL DEBUIGGING OF DATA ONLY, NOT INTENDED TO BE A PUBLIC API

const router = express.Router();
type GetDataResponse = ResultSetHeader;

router.get<{}, GetDataResponse>("/users", (req, res) => {
  dbPool.getConnection(async (err, connection) => {
    if (err) {
      throw err;
    }
    executeQuery(
      connection,
      "SELECT * FROM users",
      "failer to retrieve all users",
    )
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(200);
      });
  });
});

router.get<{}, GetDataResponse>("/rest", (req, res) => {
  dbPool.getConnection(async (err, connection) => {
    if (err) {
      throw err;
    }
    executeQuery(
      connection,
      "SELECT * FROM restaurants",
      "failer to retrieve all restaurants",
    )
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(200);
      });
  });
});

router.get<{}, GetDataResponse>("/resy", (req, res) => {
  dbPool.getConnection(async (err, connection) => {
    if (err) {
      throw err;
    }
    executeQuery(
      connection,
      "SELECT * FROM reservations",
      "failer to retrieve all reservations",
    )
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(200);
      });
  });
});

export default router;
