import createError from 'http-errors';

import handleTickersRequest from './tickers';
import { API_STORAGE_KEYS } from '../constants';
import { SERVER_CACHE } from '../data_structures';

/**
 * Method to handle fetching one piece of a heatmap for a given index. This could
 * be the changes over a year, two years, etc.
 *
 * @param {module:types.Request} request The API request
 * @returns {object} Data from the relevant heatmap for the given time period
 * @throws {module:types.HttpError} An error representing what went wrong
 */
async function handleHeatmapTimePeriodRequest(request) {
  const { timePeriod } = request.params;

  const { tickers } = await handleTickersRequest(request);

  const heatmap = await handleHeatmapRequest(request);

  const timePeriodData = heatmap[timePeriod].filter((x) => tickers.includes(x.ticker));

  return [...timePeriodData];
}

/**
 * Method to create a heatmap based on the index
 *
 * @param {module:types.Request} request The API request
 * @returns {object} A heatmap
 * @throws {module:types.HttpError} An error representing what went wrong
 */
async function handleHeatmapRequest(request) {
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

  return { ...heatmap };
}
export { handleHeatmapTimePeriodRequest, handleHeatmapRequest };
