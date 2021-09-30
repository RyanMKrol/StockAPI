import createError from 'http-errors';
import express from 'express';
import { fetchSupportedIndexes } from '../data';

const router = express.Router();

router.use('/:index', async (req, res, next) => {
  const { index } = req.params;
  const supportedIndexes = fetchSupportedIndexes();

  if (typeof index !== 'undefined' && !supportedIndexes.includes(index)) {
    const error = createError(500, 'Index unsupported');
    next(error);
  } else {
    next();
  }
});

export default router;
