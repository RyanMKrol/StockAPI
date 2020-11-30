import express from 'express';

import { INDEXES_CONFIG, API_STORAGE_KEYS } from '../constants';
import SERVER_DATA from '../data_structures';

const router = express.Router();

router.get('/:index', async (req, res) => {
  const { index } = req.params;

  if (!validateRequest(req)) {
    res.status(400);
    res.send({
      error: 'Invalid Request',
    });
  } else {
    const tickerData = SERVER_DATA.getData(API_STORAGE_KEYS.TICKERS) || {};
    const tickers = tickerData[index];
    if (tickers) {
      res.send({ count: tickers.length, tickers });
    } else {
      res.status(500);
      res.send({
        error: 'No tickers',
      });
    }
  }
});

/**
 * Method to validate the request to the tickers API
 *
 * @param {any} request A request of some kidn
 * @returns {boolean} Whether the index given is valid for this API
 */
function validateRequest(request) {
  const { index } = request.params;
  const supportedTickerIndexes = INDEXES_CONFIG.getSupportedTickersIndexes();

  return supportedTickerIndexes.includes(index);
}

export default router;
