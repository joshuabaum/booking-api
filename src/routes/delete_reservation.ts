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
  message?: string;
};

const errorTag = "DeleteReservationEndpoint Error:";

/** POST endpoint used to delete an already booked reservation for a group of users and mark it as available.
 *
 * <p> Endpoint assumes request body has a reservation_id.
 * Responds with JSON object with a status ("success", "failed") and an optional message.
 */
router.post<DeleteReservationRequestBody, DeleteReservationResponse>(
  "/",
  (req, res) => {
    // Validate params first
    const { reservation_id } = req.body;
    if (!reservation_id) {
      const errMsg: string = "missing params in request body";
      res.status(400).send({ status: "failed", message: errMsg });
      console.log(errorTag, errMsg);
      return;
    }

    try {
      dbPool.getConnection(async (err, connection) => {
        if (err) {
          throw err;
        }

        await markReservationAvailable(connection, reservation_id);
        await removeUserReservationAssociation(connection, reservation_id);

        const responseData: DeleteReservationResponse = {
          status: "success",
          message: `succesfully deleted reservation ID ${reservation_id}`,
        };
        res.send(responseData);
        connection.release();
      });
    } catch (err) {
      console.log(errorTag, err);
      res.status(500).send();
    }
  },
);

/** Marks the reservation with the provided reservationId as available.
 *
 * @param db database connection
 * @param reservation_id id of the booked reservation to be marked available.
 */
async function markReservationAvailable(
  db: Connection,
  reservation_id: number,
): Promise<void> {
  const query = `
          UPDATE reservations
          SET available = true
          WHERE reservation_id = ?;`;

  await executeQuery(db, query, "Error marking reservation available: ", [
    reservation_id,
  ]);
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
  await executeQuery(db, query, "Error removing reservation from user: ", [
    reservation_id,
  ]);
}
export default router;
