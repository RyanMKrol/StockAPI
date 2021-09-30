import express from 'express';
import INTERNAL_DATA from '../data';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/', async (req, res, next) => {
  const indexes = INTERNAL_DATA.getIndexes();
  res.send(indexes);
});

export default router;
