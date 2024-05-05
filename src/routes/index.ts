import express from "express";

import find_reservation from "./find_reservation";
import book_reservation from "./book_reservation";
import delete_reservation from "./delete_reservation";
import get_data from "./get_data";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("root api");
});

router.use("/delete_reservation", delete_reservation);
router.use("/find_reservation", find_reservation);
router.use("/book_reservation", book_reservation);
router.use("/get_data", get_data);

export default router;
