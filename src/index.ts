// src/index.ts
import express from "express";
import api_routes from "./routes";
import "dotenv/config";
import dbPool from "./database/database";
import populateDb from "./database/populate_data";

const app = express();
const port = 3000;

populateDb(dbPool);

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, TypeScript with Express!");
});

app.use("/api/v1", api_routes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
