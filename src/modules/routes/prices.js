import express from 'express';
import getInternalData from '../data';
import middlewareRouter from './middleware';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/:index', middlewareRouter, async (req, res, next) => {
  const { index } = req.params;

  const internalData = await getInternalData();

  const tickers = await internalData.getTickers(index);
  const prices = await internalData.getPriceHistory(tickers[0]);

  res.send(prices);
});

export default router;
