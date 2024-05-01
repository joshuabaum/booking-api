import express from "express";

const router = express.Router();

// TODO: FindReservationResponse type --> possibly interface. Should return a list of booking data model.
type FindReservationResponse = string;

router.get<{}, FindReservationResponse>('/', (req, res) => {
    // TODO: FindReservationResponse logic
    res.json("todo");
})

export default router;