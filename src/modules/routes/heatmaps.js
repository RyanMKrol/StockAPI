import express from 'express';
import { handleHeatmapTimePeriodRequest, handleHeatmapRequest } from '../api';

const router = express.Router();

router.get('/:index', async (req, res, next) => {
  try {
    const data = await handleHeatmapRequest(req);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

router.get('/:index/:timePeriod', async (req, res, next) => {
  try {
    const data = await handleHeatmapTimePeriodRequest(req);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

export default router;
