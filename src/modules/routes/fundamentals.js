import express from 'express';
import middlewareRouter from './middleware';

import getInternalData from '../data';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/:index', middlewareRouter, async (req, res, next) => {
  const { index } = req.params;

  const internalData = await getInternalData();
  const fundamentals = await internalData.getFundamentals(index);

  res.send(fundamentals);
});

export default router;
