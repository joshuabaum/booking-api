import express from "express";

const router = express.Router();

// TODO: CreateReservationResponse type
type CreateReservationResponse = boolean;

router.get<{}, CreateReservationResponse>('/', (req, res) => {
    // TODO: CreateReservationResponse logic
    res.json(true);
})

export default router;