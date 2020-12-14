import createError from 'http-errors';

import handleTickersRequest from './tickers';
import { API_STORAGE_KEYS } from '../constants';
import { SERVER_CACHE } from '../data_structures';

/**
 * Method to handle request for tickers, given an index
 *
 * @param {module:types.Request} request The API request
 * @returns {object} Either the data to return, or an error object
 * @throws {module:types.HttpError} An error representing what went wrong
 */
async function handleRequest(request) {
  const tickersHandled = await handleTickersRequest(request);

  const { tickers } = tickersHandled;

  const heatmapStorage = SERVER_CACHE.getData(API_STORAGE_KEYS.HEATMAPS) || {};
  const heatmapsData = heatmapStorage.FTSE_ALL_SHARE;

  if (!heatmapsData) {
    throw createError(500, 'No Heatmaps Currently');
  }

  const heatmap = Object.keys(heatmapsData).reduce((acc, timePeriod) => {
    acc[timePeriod] = heatmapsData[timePeriod].data.filter((item) => tickers.includes(item.ticker));
    return acc;
  }, {});

  return {
    heatmap,
  };
}

export default handleRequest;
