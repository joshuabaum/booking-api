import express from "express";

const router = express.Router();

// TODO: FindReservationResponse
type BookReservationResponse = boolean;

router.get<{}, BookReservationResponse>('/', (req, res) => {
    // TODO: BookReservationResponse logic
    res.json(true);
})

export default router;