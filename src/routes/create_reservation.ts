import express from "express";
import dbPool from "../database/database";

const router = express.Router();

// TODO: CreateReservationResponse type
type CreateReservationResponse = boolean;

router.get<{}, CreateReservationResponse>("/", async (req, res) => {
  // TODO: CreateReservationResponse logic.
  res.json(true);
});

export default router;
