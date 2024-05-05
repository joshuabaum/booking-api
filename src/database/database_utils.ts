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
