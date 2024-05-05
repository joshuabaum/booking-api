import express from "express";
import { Request, Response } from "express";
import dbPool from "../database/database";
import {
  executeQuery,
  getDateWithoutTimezoneOffset,
} from "../database/database_utils";

import { RowDataPacket, Connection, ResultSetHeader } from "mysql2";

const router = express.Router();

export type FindReservationResponse = {
  restaurant_name: string;
  restaurant_id: string;
  start_time: Date;
  num_seats: number;
  supported_diets: string[];
};

type FindReservationRequestQuery = {
  user_ids: string;
  time: string; // for simplicity assume this is sent in javaScript Date string format
};

const errorTag = "FindReservationEndpoint Error:";

/** GET endpoint used to find all reservations for a group of users at a desired time.
 *
 * <p> Endpoint assumes url params include a time string (in ISO 8601 format) and a list of user_ids.
 * Responds with a list of all reservations which meet the user's time and dietary requirements.
 *
 * Examples
 * http://localhost:3000/api/v1/find_reservation/?user_ids=1,2,3,4,5,9,10&time=2024-05-19T02:00:00
 * http://localhost:3000/api/v1/find_reservation/?user_ids=18,2,10&time=2024-05-19T04:00:00
 * http://localhost:3000/api/v1/find_reservation/?user_ids=11,12&time=2024-05-19T02:30:00
 *
 */
router.get<FindReservationRequestQuery, FindReservationResponse>(
  "/",
  (req: Request, res: Response) => {
    // Validate query params
    const { time, user_ids } = req.query as FindReservationRequestQuery;
    if (!req.query || !user_ids || !time) {
      const errMsg: string = "missing query parms for request";
      res.status(400).send();
      console.log(errorTag, errMsg);
      return;
    }
    // Format params
    const userIds: number[] = user_ids.split(",").map((item) => parseInt(item));
    const desiredTime: Date = getDateWithoutTimezoneOffset(time);

    try {
      dbPool.getConnection(async (err, connection) => {
        if (err) {
          throw err;
        }

        const areUserIdsValid = await validateUserIds(connection, userIds);
        if (!areUserIdsValid) {
          const errMsg: string = "invalid user_id in request";
          res.status(400).send(errMsg);
          console.log(errMsg);
          return;
        }

        // Check if any users already have a booked reservation which overlaps which desired time.
        // If yes return early.
        const times: Date[] = await getUsersBookedReservationTimes(
          connection,
          userIds,
        );
        if (checkTimeOverlap(times, desiredTime)) {
          res.send({
            message:
              "one or more users in group already has a reservation within 2 hours of desired time.",
          });
          return;
        }

        // We need to retrieve users' dietary restrictions to filter restaurants.
        const dietRestrictions: Set<string> = await getUserDietRestrictions(
          connection,
          userIds,
        );

        const response: FindReservationResponse[] =
          await getPossibleReservations(
            connection,
            [...dietRestrictions],
            desiredTime,
          );
        res.status(200).send(response);
        connection.release();
      });
    } catch (err) {
      console.log(errorTag, err);
      res.status(500).send();
      return;
    }
  },
);

/** Returns true if there is an overlap between the bookedTimes and desiredReservationTime. */
function checkTimeOverlap(
  bookedTimes: Date[],
  desiredReservationTime: Date,
): boolean {
  // Reservations last two hours.
  // If the difference between any booked time and the desiredReservationTime is less than two hours then there is an overlap.
  return (
    bookedTimes.filter((time) => {
      const timeDiffMs = time.getTime() - desiredReservationTime.getTime();
      const hoursDifference = timeDiffMs / (1000 * 60 * 60);
      return hoursDifference < 2;
    }).length > 0
  );
}

/** Returns a list of all start times for reservations which are already booked for users with the provided userIds.
 */
async function getUsersBookedReservationTimes(
  db: Connection,
  userIds: number[],
): Promise<Date[]> {
  const userIdFill = "?, ".repeat(userIds.length).slice(0, -2);
  var query = `
            SELECT
                resy.start_time as start_time
            FROM reservations AS resy
            JOIN user_reservations_association AS assoc
                ON assoc.reservation_id = resy.reservation_id
            JOIN users as users
                ON assoc.user_id = users.user_id
                WHERE users.user_id in (${userIdFill})`;
  const rows: ResultSetHeader = await executeQuery(
    db,
    query,
    "Error getting booked reservations times for users",
    userIds,
  );

  const times: any[] = JSON.parse(JSON.stringify(rows));

  // Use set in case there's repeated already booked times.
  const start_times: Set<string> = new Set();
  for (const val of times.values()) {
    // Add raw time string to set. Convert to date late because otherwise they will all be different objects.
    start_times.add(val.start_time);
  }

  return [...start_times].map((item) => getDateWithoutTimezoneOffset(item));
}

/** Returns a list of reservations which meet the provided dietRestrictions and startTime.
 *
 * @param db database connection
 * @param dietRestrictions diet restrictions for all users.
 * @param startTime the desired start time for the reservation.
 */
async function getPossibleReservations(
  db: Connection,
  dietRestrictions: string[],
  startTime: Date,
): Promise<any> {
  var query = createPossibleReservationQueryString(dietRestrictions, startTime);

  const rows: ResultSetHeader = await executeQuery(
    db,
    query,
    "Error fetching possible reservations diet restrictions: ",
  );
  return rows;
}

/** Create a query string to filter out reservations which do not meet start time and dietary restrictions needed by the user.
 *
 * @param dietRestrictions list of dietary restrictions for the users.
 * @param startTime start time for the reservation.
 * @return SQL query to find all reservations which match user need.
 */
function createPossibleReservationQueryString(
  dietRestrictions: string[],
  startTime: Date,
): string {
  const time: String = startTime.toISOString();

  // Query Summary:
  // 1. Join restaurants and reservations (ideally filter time before joining, but not done here for sake of time.)
  // 2. Filter by reservations which meet all dietary needs.s
  // 3. Filter by startTime within 15 minutes of desired time. Note that time is validated against other user reservations before query.
  var query = `
                        SELECT
                            rest.restaurant_id,
                            rest.name AS restaurant_name,
                            rest.diet_support,
                            resy.reservation_id,
                            TIMESTAMPDIFF(MINUTE, resy.start_time, CAST('${time}' AS DATETIME)) as time_diff_minutes,
                            resy.num_seats,
                            resy.start_time
                        FROM
                            restaurants rest
                        INNER JOIN reservations resy ON rest.restaurant_id = resy.restaurant_id 
                        WHERE ABS(TIMESTAMPDIFF(MINUTE, resy.start_time, CAST('${time}' AS DATETIME))) <= 15`;

  // Add a restriction for each dietery need. DietaryRestrictions queried from database do not need to worry about injection.
  if (dietRestrictions.length > 0) {
    for (var i = 0; i < dietRestrictions.length; i++) {
      query += ` AND FIND_IN_SET("${dietRestrictions[0]}", rest.diet_support) > 0 `;
    }
  }

  query += "ORDER BY time_diff_minutes ASC";

  return query;
}

/**
 * Queries and find a set of all dietary restrictins for the group of users.
 *
 * @param db database connection
 * @param userIds list of ids for the users
 * @returns set of all dietary restrictions for the users.
 */
async function getUserDietRestrictions(
  db: Connection,
  userIds: number[],
): Promise<Set<string>> {
  // Prepare the SQL query to fetch diet_restrictions for the given user IDs
  const placeholders = Array.from(userIds)
    .map(() => "?")
    .join(","); // Generate placeholders for the IN clause
  const query = `
        SELECT diet_restrictions, name
        FROM users
        WHERE user_id IN (${placeholders})
    `;
  const rows: ResultSetHeader = await executeQuery(
    db,
    query,
    "Failed To Retrieve User Dietary Restrictions: ",
    userIds,
  );

  // Extract diet_restrictions from the result and aggregate them into a set
  const dietRestrictionsSet = new Set<string>();
  for (const row of JSON.parse(JSON.stringify(rows)) as RowDataPacket[]) {
    const dietRestrictions = row.diet_restrictions;
    if (dietRestrictions) {
      // Parse the JSON array of diet_restrictions and add them to the set
      const restrictionsArray = dietRestrictions.split(",");
      restrictionsArray.forEach((restriction: string) => {
        dietRestrictionsSet.add(restriction);
      });
    }
  }
  return dietRestrictionsSet;
}

/** Returns true if all provided userIds are associated with a user. */
async function validateUserIds(
  db: Connection,
  userIds: number[],
): Promise<Boolean> {
  // Prepare the SQL query to fetch diet_restrictions for the given user IDs
  const placeholders = Array.from(userIds)
    .map(() => "?")
    .join(","); // Generate placeholders for the IN clause
  const query = `
          SELECT COUNT(*) as count
          FROM users
          WHERE user_id IN (${placeholders})
      `;
  const rows: ResultSetHeader = await executeQuery(
    db,
    query,
    "Failed To Validate User IDs: ",
    userIds,
  );

  return JSON.parse(JSON.stringify(rows))[0].count == userIds.length;
}

export default router;
