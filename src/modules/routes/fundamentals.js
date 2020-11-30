import express from 'express';
import { handleFundamentalsRequest } from '../api';

const router = express.Router();

router.get('/:index', async (req, res, next) => {
  try {
    const data = await handleFundamentalsRequest(req);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

export default router;
