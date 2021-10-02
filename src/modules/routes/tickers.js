import express from 'express';
import getInternalData from '../data';
import middlewareRouter from './middleware';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/:index', middlewareRouter, async (req, res, next) => {
  const { index } = req.params;

  const internalData = await getInternalData();
  const tickers = await internalData.getTickers(index);

  res.send(tickers);
});

export default router;
