import express from "express";

const router = express.Router();

// TODO: DeleteReservationResponse type
type DeleteReservationResponse = boolean;

router.get<{}, DeleteReservationResponse>("/", (req, res) => {
  // TODO: CreateReservationResponse logic
  res.json(true);
});

export default router;
