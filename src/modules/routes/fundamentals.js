import express from 'express';
import getInternalData from '../data';
import middlewareRouter from './middleware';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/:index', middlewareRouter, async (req, res, next) => {
  const { index } = req.params;

  const internalData = await getInternalData();
  const fundamentals = await internalData.getFundamentals(index);

  res.send(fundamentals);
});

export default router;
