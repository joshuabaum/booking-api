import express from "express";
import dbPool from "../database/database";

const router = express.Router();

// TODO: FindReservationResponse
type BookReservationResponse = {
  status: string;
};

type BookReservationRequestBody = {
  reservation_id: number;
  user_ids: number[];
};

// Takes list of user ids and a reservatiosn id

router.post<Request, BookReservationResponse>("/", (req, res) => {
  // TODO: BookReservationResponse logic
  const { reservation_id, user_ids } = req.body as BookReservationRequestBody;

  if (!reservation_id || !reservation_id) {
    const errMsg: string = "missing params in request body";
    res.status(404).send({ status: "failed" });
    console.log(errMsg);
    return;
  }

  dbPool.getConnection(async (err, connection) => {
    if (err) {
      throw err;
    }

    // res.send(response);
    connection.release();
  });
});

export default router;
