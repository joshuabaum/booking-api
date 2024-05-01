import express from "express";

import create_reservation from "./create_reservation";
import find_reservation from "./find_reservation";
import book_reservation from "./book_reservation";
import delete_reservation from "./delete_reservation";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("root api");
});

router.use("/create_reservation", create_reservation);
router.use("/delete_reservation", delete_reservation);
router.use("/find_reservation", find_reservation);
router.use("/book_reservation", book_reservation);

export default router;