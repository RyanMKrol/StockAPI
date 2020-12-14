import express from 'express';
import { handleHeatmapsRequest } from '../api';

const router = express.Router();

router.get('/:index', async (req, res, next) => {
  try {
    const data = await handleHeatmapsRequest(req);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

export default router;
