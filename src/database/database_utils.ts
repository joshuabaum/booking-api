import { error } from "console";
import { Connection, ResultSetHeader } from "mysql2";

/**
 * Executes the provided query and returns a promise with results.
 *
 * @param query the query string.
 * @param error string to log with error message
 * @param query_args optional list of args to fill the query string if needed.
 */
export function executeQuery(
  db: Connection,
  query: string,
  error: string,
  query_args?: any,
): Promise<ResultSetHeader> {
  return new Promise<ResultSetHeader>((resolve, reject) => {
    if (query_args) {
      db.query(
        query,
        query_args,
        (err: Error | null, result: ResultSetHeader) => {
          if (err) {
            reject(error + err);
          } else {
            resolve(result);
          }
        },
      );
    } else {
      db.query(query, (err: Error | null, result: ResultSetHeader) => {
        if (err) {
          reject(error + err);
        } else {
          resolve(result);
        }
      });
    }
  });
}

/**
 * Returns a date with the timezone offset removed.
 * @param date
 * @returns a new Date with timezone offset removed.
 */
export function getDateWithoutTimezoneOffset(date: Date | string): Date {
  if (date instanceof Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  } else if (typeof date === "string") {
    const tempDate = new Date(date);
    return new Date(tempDate.getTime() - tempDate.getTimezoneOffset() * 60000);
  } else {
    throw error;
  }
}

/**
 * Returns the a string format of the provided date for comparison with DATETIME stored in database.
 * @param date
 * @returns string formatted for SQL datetime comparsion.
 */
export function getDateTimeForTable(date: Date): String {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
