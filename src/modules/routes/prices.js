import express from 'express';
import INTERNAL_DATA from '../data';
import middlewareRouter from './middleware';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/:index', middlewareRouter, async (req, res, next) => {
  const { index } = req.params;

  const tickers = await INTERNAL_DATA.getTickers(index);
  const prices = await INTERNAL_DATA.getPrices(tickers[0]);

  res.send(prices);
});

export default router;
