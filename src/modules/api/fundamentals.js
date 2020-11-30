import createError from 'http-errors';

import handleTickersRequest from './tickers';
import { API_STORAGE_KEYS } from '../constants';
import SERVER_DATA from '../data_structures';

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

  const fundamentalsData = SERVER_DATA.getData(API_STORAGE_KEYS.FUNDAMENTALS) || {};
  const arrayFundamentalsData = Object.values(fundamentalsData);

  const fundamentals = arrayFundamentalsData.filter((data) => tickers.includes(data.ticker));

  if (!fundamentals || fundamentals.length === 0) {
    throw createError(500, 'No Fundamentals Currently');
  }

  return {
    count: fundamentals.length,
    fundamentals,
  };
}

export default handleRequest;
