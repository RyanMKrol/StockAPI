// app.js

import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import createError from 'http-errors';
import cors from 'cors';
import updateServiceData from './daemon';
import { tickersRouter, fundamentalsRouter, heatmapsRouter } from './modules/routes';

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/tickers', tickersRouter);
app.use('/fundamentals', fundamentalsRouter);
app.use('/heatmaps', heatmapsRouter);

// Unknown calls receive a generic 404
app.use((req, res, next) => {
  next(createError(404));
});

updateServiceData();

export default app;
