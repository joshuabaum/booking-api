describe("POST bookReservation route", () => {
  // TODO: API has been verified through manual testing locally. E2E and unit tests are needed. Unfortunately omitted for the sake of time but minimal test cases are described below.
  test("Request with empty query params: returns a 400 status code", () => {});
  test("Request with invalid users_ids: returns a 400 status code", () => {});
  test("Request with invalid reservation_id: returns a 400 status code", () => {});
  test("Make valid request: reservation marked booked", () => {});
  test("Make valid request: user reservation association created", () => {});
  test("Attempt to book unavailable reservation: booking fails", () => {});
  test("Attempt to book reservation twice: second booking fails", () => {});
});
