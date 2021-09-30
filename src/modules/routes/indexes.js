import express from 'express';
import { fetchSupportedIndexes } from '../data';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/', async (req, res, next) => {
  const indexes = fetchSupportedIndexes();
  res.send(indexes);
});

export default router;
