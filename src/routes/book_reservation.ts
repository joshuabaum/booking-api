import express from "express";
import dbPool from "../database/database";
import { Connection, ResultSetHeader } from "mysql2";
import { executeQuery } from "../database/database_utils";

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

    await bookReservation(connection, reservation_id);
    await createReservationUsersAssociation(
      connection,
      reservation_id,
      user_ids,
    );

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
 * @return boolean indicating whether or not reservation is available.
 */
async function isReservationAvailable(
  db: Connection,
  reservation_id: number,
): Promise<boolean> {
  const query = `SELECT available as available
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
    return JSON.parse(JSON.stringify(rows))[0].available;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/** Books the reservation with the provided reservationId.
 *
 * @param db database connection
 * @param reservation_id id of the reservation being booked.
 */
async function bookReservation(
  db: Connection,
  reservation_id: number,
): Promise<void> {
  const query = `
        UPDATE reservations
        SET available = false
        WHERE reservation_id = ?;`;

  try {
    const rows: ResultSetHeader = await executeQuery(
      db,
      query,
      "Error booking reservation: ",
      [reservation_id],
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
async function createReservationUsersAssociation(
  db: Connection,
  reservation_id: number,
  user_ids: number[],
): Promise<void> {
  const insertString =
    "INSERT INTO user_reservations_association (user_id, reservation_id) VALUES ?";
  const valuesToInsert = user_ids.map((id) => [id, reservation_id]);

  try {
    await executeQuery(
      db,
      insertString,
      "Error inserting user reservation assocation table: ",
      [valuesToInsert],
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export default router;
