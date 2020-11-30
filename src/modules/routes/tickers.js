import express from 'express';
import handleRequest from '../api';

const router = express.Router();

router.get('/:index', async (req, res, next) => {
  try {
    const data = await handleRequest(req);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

export default router;
