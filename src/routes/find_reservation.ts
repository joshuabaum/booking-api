import express from "express";
import { Request, Response } from "express";
import dbPool from "../database/database";
import { executeQuery } from "../database/database_utils";

import { RowDataPacket, Connection, ResultSetHeader } from "mysql2";

const router = express.Router();

type FindReservationResponse = {
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

// Example http://localhost:3000/api/v1/find_reservation/?user_ids=1,2,3,12&time=2022-05-20T12:00:00
router.get<FindReservationRequestQuery, FindReservationResponse>(
  "/",
  (req: Request<{}, {}, {}, FindReservationRequestQuery>, res: Response) => {
    const { time, user_ids } = req.query as FindReservationRequestQuery;
    if (!req.query || !user_ids || !time) {
      const errMsg: string = "missing query parms for request";
      res.status(404).send(errMsg);
      console.log(errMsg);
      return;
    }

    const userIds: number[] = user_ids.split(",").map((item) => parseInt(item));
    // Assume time is unix code
    const timeDate: Date = new Date(parseInt(time));

    dbPool.getConnection(async (err, connection) => {
      if (err) {
        // TODO figure out what the right error code is
        res.status(400).send();
        throw err;
      }

      const areUserIdsValid = await validateUserIds(connection, userIds);
      if (!areUserIdsValid) {
        const errMsg: string = "invalid user_id in request";
        res.status(404).send(errMsg);
        console.log(errMsg);
        return;
      }

      // TODO: query for all users current reservations and verify that given state time is valid

      const dietRestrictions: Set<string> = await getUserDietRestrictions(
        connection,
        userIds,
      );

      const response: FindReservationResponse[] = await getPossibleReservations(
        connection,
        [...dietRestrictions],
        new Date(time),
      );
      res.send(response);
      connection.release();
    });
  },
);

async function getPossibleReservations(
  db: Connection,
  dietRestrictions: string[],
  start_time: Date,
): Promise<any> {
  // Query Summary:
  // 1. Join restaurants and reservations (ideally filter time before joining, but not done here for sake of time.)
  // 2. Filter by reservations which meet all dietary needs.s
  // 3. Filter by start_time within 15 minutes of desired time. Note that time is validated against other user reservations before query.
  var query = createPossibleReservationQueryString(
    dietRestrictions,
    start_time,
  );

  try {
    const rows: ResultSetHeader = await executeQuery(
      db,
      query,
      "Error fetching possible reservations diet restrictions: ",
    );
    return rows;
  } catch (error) {
    // Handle any errors that occur during the database query
    console.error(
      "Error fetching possible reservations diet restrictions:",
      error,
    );
    throw error;
  }
}

/** Create a query string to filter out reservations which do not meet start time and dietary restrictions needed by the user.
 *
 * @param dietRestrictions list of dietary restrictions for the users.
 * @param start_time start time for the reservation.
 * @return SQL query to find all reservations which match user need.
 */
function createPossibleReservationQueryString(
  dietRestrictions: string[],
  start_time: Date,
): string {
  const time: String = new Date(
    start_time.getTime() - start_time.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .replace("T", " ");

  // Query Summary:
  // 1. Join restaurants and reservations (ideally filter time before joining, but not done here for sake of time.)
  // 2. Filter by reservations which meet all dietary needs.s
  // 3. Filter by start_time within 15 minutes of desired time. Note that time is validated against other user reservations before query.
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
  try {
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
  } catch (error) {
    console.error("Error fetching user diet restrictions:", error);
    throw error;
  }
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
  try {
    const rows: ResultSetHeader = await executeQuery(
      db,
      query,
      "Failed To Validate User IDs: ",
      userIds,
    );

    return JSON.parse(JSON.stringify(rows))[0].count == userIds.length;
  } catch (error) {
    console.error("Error validating user diet restrictions:", error);
    throw error;
  }
}

export default router;
