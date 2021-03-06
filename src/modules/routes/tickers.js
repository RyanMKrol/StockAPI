import express from 'express';
import { handleTickersRequest } from '../api';

const router = express.Router();

router.get('/:index', async (req, res, next) => {
  try {
    const data = await handleTickersRequest(req);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

export default router;
