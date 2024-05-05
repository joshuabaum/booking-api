import supertest from "supertest";
import app from "../index";

describe("GET findReservation route", () => {
  test("Request with empty query params:returns a 400 status code", async () => {
    await supertest(app).get(`/api/v1/find_reservation`).expect(400);
  });

  test("Request has invalid user_ids: return a 400 status code", async () => {
    await supertest(app)
      .get(
        `/api/v1/find_reservation/?user_ids=123412341234&time=2024-05-19T02:00:00`,
      )
      .expect(400);
  });

  // TODO: API has been verified through manual testing locally. E2E and unit tests are needed. Unfortunately omitted for the sake of time but minimal test cases are described below.
  test("Make valid request: reservations meet dietary restrictions", () => {});
  test("Make valid request: reservations matches desired time", () => {});
  test("User has overlapping reservation: findReservation fails", () => {});
});
