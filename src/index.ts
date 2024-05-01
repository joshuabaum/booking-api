// src/index.ts
import express from 'express';
import api_routes from './routes'

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

app.use('/api/v1', api_routes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;