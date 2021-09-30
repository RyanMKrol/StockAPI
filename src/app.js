// app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import createError from 'http-errors';
import cors from 'cors';

import tickersRouter from './modules/routes/tickers';
import indexesRouter from './modules/routes/indexes';
import pricesRouter from './modules/routes/prices';
import fundamentalsRouter from './modules/routes/fundamentals';

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/tickers', tickersRouter);
app.use('/indexes', indexesRouter);
app.use('/prices', pricesRouter);
app.use('/fundamentals', fundamentalsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

export default app;
