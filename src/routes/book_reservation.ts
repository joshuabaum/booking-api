import express from "express";
import dbPool from "../database/database";
import { Connection, ResultSetHeader } from "mysql2";
import { executeQuery } from "../database/database_utils";

const router = express.Router();

type BookReservationRequestBody = {
  reservation_id: number;
  user_ids: number[];
};

type BookReservationResponse = {
  status: string;
  message?: string;
};

const errorTag = "BookReservationEndpoint Error:";

/** POST endpoint used to book a reservation for a group of users.
 *
 * <p> Endpoint assumes request body has a reservation_id and list of user_ids.
 * Responds with JSON object with a status ("success", "failed") and an optional message.
 */
router.post<BookReservationRequestBody, BookReservationResponse>(
  "/",
  (req, res) => {
    // Validate params first
    const { reservation_id, user_ids } = req.body;
    if (!reservation_id || !user_ids) {
      const errMsg: string = "missing params in request body";
      res.status(404).send({ status: "failed", message: errMsg });
      console.log(errorTag, errMsg);
      return;
    }

    try {
      dbPool.getConnection(async (err, connection) => {
        if (err) {
          throw err;
        }

        const isAvailable = await isReservationAvailable(
          connection,
          reservation_id,
        );
        if (!isAvailable) {
          res.send({
            status: "failed",
            message: "Reservation already booked.",
          });
          return;
        }

        await markReservationBooked(connection, reservation_id);
        await createReservationUsersAssociation(
          connection,
          reservation_id,
          user_ids,
        );

        res.send({
          status: "succesful",
        });

        connection.release();
      });
    } catch (err) {
      console.log(errorTag, err);
      res.status(500).send();
    }
  },
);

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
  const query = `SELECT available
                FROM 
                    reservations
                WHERE 
                    reservation_id = ?`;
  const rows: ResultSetHeader = await executeQuery(
    db,
    query,
    "Error fetching possible reservations diet restrictions: ",
    reservation_id,
  );
  return JSON.parse(JSON.stringify(rows))[0].available;
}

/** Marked the reservation with the provided reservationId as booked (not available).
 *
 * @param db database connection
 * @param reservation_id id of the reservation being booked.
 */
async function markReservationBooked(
  db: Connection,
  reservation_id: number,
): Promise<void> {
  const query = `
        UPDATE reservations
        SET available = false
        WHERE reservation_id = ?;`;

  await executeQuery(db, query, "Error booking reservation: ", [
    reservation_id,
  ]);
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

  await executeQuery(
    db,
    insertString,
    "Error inserting user reservation assocation table: ",
    [valuesToInsert],
  );
}

export default router;
