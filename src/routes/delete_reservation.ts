import express from "express";
import dbPool from "../database/database";
import { Connection, ResultSetHeader } from "mysql2";
import { executeQuery } from "../database/database_utils";

const router = express.Router();

type DeleteReservationRequestBody = {
  reservation_id: number;
};
type DeleteReservationResponse = {
  status: string;
};

router.post<DeleteReservationRequestBody, DeleteReservationResponse>(
  "/",
  (req, res) => {
    const { reservation_id } = req.body as DeleteReservationRequestBody;

    if (!reservation_id) {
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

      await markReservationAvailable(connection, reservation_id);
      await removeUserReservationAssociation(connection, reservation_id);

      res.send({
        status: "succesfully deleted reservation!",
      });
      connection.release();
    });
  },
);

/** Marks the reservation with the provided reservationId as available.
 *
 * @param db database connection
 * @param reservation_id id of the booked reservation.
 */
async function markReservationAvailable(
  db: Connection,
  reservation_id: number,
): Promise<void> {
  const query = `
          UPDATE reservations
          SET available = true
          WHERE reservation_id = ?;`;

  try {
    const rows: ResultSetHeader = await executeQuery(
      db,
      query,
      "Error marking reservation available: ",
      [reservation_id],
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/** Deletes the (user_id : reservation_id) assocation for the deleted reservations.
 *
 * @param db database connection
 * @param reservation_id id of the deleted reservation.
 */
async function removeUserReservationAssociation(
  db: Connection,
  reservation_id: number,
): Promise<void> {
  const query = ` DELETE FROM user_reservations_association
    WHERE reservation_id = ?;
    `;
  try {
    const rows: ResultSetHeader = await executeQuery(
      db,
      query,
      "Error removing reservation from user: ",
      [reservation_id],
    );
    console.log(rows);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export default router;
