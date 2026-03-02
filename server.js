import 'dotenv/config';
import express from 'express';
import routes from './routes/index.js';
import { sequelize } from './models/index.js'
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
routes(app);


async function start() {
  try {
    await sequelize.sync()
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error(err)
  }
}

start()