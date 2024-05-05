import express from "express";
import dbPool from "../database/database";
import { RowDataPacket, Connection, ResultSetHeader } from "mysql2";
import { executeQuery } from "../database/database_utils";
import { connect } from "http2";

const router = express.Router();

type BookReservationResponse = {
  status: string;
};

type BookReservationRequestBody = {
  reservation_id: number;
  user_ids: number[];
};

router.post<Request, BookReservationResponse>("/", (req, res) => {
  const { reservation_id, user_ids } = req.body as BookReservationRequestBody;

  if (!reservation_id || !user_ids) {
    const errMsg: string = "missing params in request body";
    res.status(404).send({ status: "failed" });
    console.log(errMsg);
    return;
  }

  dbPool.getConnection(async (err, connection) => {
    if (err) {
      res.status(400).send();
      throw err;
    }

    const isAvailable = await isReservationAvailable(
      connection,
      reservation_id,
    );
    if (!isAvailable) {
      res.send({
        status: "Failed. Reservation already booked.",
      });
      return;
    }

    await bookReservation(connection, reservation_id, user_ids);
    await updateUsersWithReservation(connection, reservation_id, user_ids);

    res.send({
      status: isAvailable ? "booking succesful!" : "booking failed :(",
    });

    connection.release();
  });
});

/**
 * Returns true if the reservation with the provded @param reservation_id is available.
 *
 * @param db
 * @param reservation_id
 * @returns
 */
async function isReservationAvailable(
  db: Connection,
  reservation_id: number,
): Promise<boolean> {
  const query = `SELECT user_ids as user_ids
                FROM 
                    reservations
                WHERE 
                    reservation_id = ?`;
  try {
    const rows: ResultSetHeader = await executeQuery(
      db,
      query,
      "Error fetching possible reservations diet restrictions: ",
      reservation_id,
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
  // If user_ids does not have data field then the reservation is available.
  return JSON.parse(JSON.stringify(rows))[0].user_ids.data.length == 0;
}

/** Books the reservation with the provided reservationId.
 *
 * @param db database connection
 * @param reservation_id id of the reservation being booked.
 * @param user_ids id of the users booking the reservation.
 */
async function bookReservation(
  db: Connection,
  reservation_id: number,
  user_ids: number[],
): Promise<void> {
  const userIdFillFields = "?, ".repeat(user_ids.length).slice(0, -2);
  const query = `
        UPDATE reservations
        SET user_ids = '{"data" : [${userIdFillFields}]}'
        WHERE reservation_id = ?;`;

  try {
    const rows: ResultSetHeader = await executeQuery(
      db,
      query,
      "Error booking reservation: ",
      user_ids.concat([reservation_id]),
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/** Updates the users booked reservations with the provided reservationId.
 *
 * @param db database connection
 * @param reservation_id id of the reservation the users have booked.
 * @param user_ids id of the users who booked the reservation.
 */
async function updateUsersWithReservation(
  db: Connection,
  reservation_id: number,
  user_ids: number[],
): Promise<void> {
  const userIdFillFields = "?, ".repeat(user_ids.length).slice(0, -2);
  const query = `
        UPDATE users
        SET reservation_ids = JSON_ARRAY_APPEND(reservation_ids, '$.data', ?)
        WHERE user_id in (${userIdFillFields});`;

  try {
    await executeQuery(
      db,
      query,
      "Error updating users with reservation: ",
      [reservation_id].concat(user_ids),
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export default router;
