import express from 'express';
import INTERNAL_DATA from '../data';
import middlewareRouter from './middleware';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/:index', middlewareRouter, async (req, res, next) => {
  const { index } = req.params;

  const fundamentals = await INTERNAL_DATA.getFundamentals(index);

  res.send(fundamentals);
});

export default router;
