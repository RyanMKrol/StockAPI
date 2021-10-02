import express from 'express';
import getInternalData from '../data';

const router = express.Router();

// eslint-disable-next-line no-unused-vars
router.get('/', async (req, res, next) => {
  const internalData = await getInternalData();
  const indexes = internalData.getIndexes();
  res.send(indexes);
});

export default router;
