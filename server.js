import 'dotenv/config';
import express from 'express';
import routes from './routes/index.js';
import { sequelize } from './models/index.js'
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
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