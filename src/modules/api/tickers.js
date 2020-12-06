import createError from 'http-errors';

import { INDEXES_CONFIG, API_STORAGE_KEYS } from '../constants';
import { SERVER_CACHE } from '../data_structures';

/**
 * Method to handle request for tickers, given an index
 *
 * @param {module:types.Request} request The API request
 * @returns {object} Either the data to return, or an error object
 * @throws {module:types.HttpError} An error representing what went wrong
 */
async function handleRequest(request) {
  const { index } = request.params;

  if (!validateRequest(request)) {
    throw createError(400);
  }

  const tickerData = SERVER_CACHE.getData(API_STORAGE_KEYS.TICKERS) || {};
  const tickers = tickerData[index];

  if (!tickers) {
    throw createError(500, 'No Tickers Currently');
  }

  return {
    count: tickers.length,
    tickers,
  };
}

/**
 * Method to validate the request to the tickers API
 *
 * @param {module:types.Request} request The API request
 * @returns {boolean} Whether the index given is valid for this API
 */
function validateRequest(request) {
  const { index } = request.params;
  const supportedTickerIndexes = INDEXES_CONFIG.getSupportedTickersIndexes();

  return supportedTickerIndexes.includes(index);
}

export default handleRequest;
