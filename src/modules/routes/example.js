import express from 'express';

const router = express.Router();

router.use('/', async (req, res, next) => {
  process.stdout.write('Using some custom middleware!');
  next();
});

// eslint-disable-next-line no-unused-vars
router.get('/', async (req, res, next) => {
  res.send('Sending back some data');
});

export default router;
