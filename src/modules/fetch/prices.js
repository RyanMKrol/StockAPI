import fetch from 'node-fetch';
import { sleep } from 'noodle-utils';

import { ALPHA_VANTAGE_CREDENTIALS, info, error } from '../constants';
import { DownstreamBadRequest, DownstreamRateLimitExceeded } from '../errors';
import { SimpleRetryWrapper } from '../data_structures';

const DAY_MS = 1000 * 60 * 60 * 24;
const MINIMUM_WAIT_BETWEEN_CALLS_MS = 14 * 1000;

let lastCallTimeMS = 0;

/**
 * Main
 *
 * @param {string} ticker The ticker to fetch data for
 * @param {number} [daysOfData] The days of data to restrict the response to
 * @returns {Array.<FormattedTickerPriceData>} An object holding the heatmap data, for multiple
 * time periods, for each stock in the given index
 */
async function fetchTickerPrices(ticker, daysOfData) {
  // if the API is called too soon after the last call we have to wait until the API
  // rate limit conditions are met (5 calls per minute)
  await conditionalWait();

  const formattedTicker = formatTickerForCall(ticker);

  info('Fetching data for ticker: %s, for this many days: %s', formattedTicker, daysOfData);

  /**
   * Method to fetch price data
   *
   * @returns {Array.<FormattedTickerPriceData>} An object holding the heatmap data, for multiple
   * time periods, for each stock in the given index
   */
  const retryMethod = async () => fetchTickerPriceData(formattedTicker).then(async (priceData) => {
    info('For ticker: %s, fetched this many items: %s', formattedTicker, priceData.length);

    const trimmedPriceData = daysOfData ? trimResponse(priceData, daysOfData) : priceData;

    info('Trimmed API response down to this many items: %s', trimmedPriceData.length);

    const processedResponse = processAlphavantageApiResponse(trimmedPriceData);

    setLatestCallTime();

    return processedResponse;
  });

  /**
   * Policy to apply to price fetch method
   *
   * @param {any} data Either the processed data, or an error from the API
   * @returns {boolean} Whether to retry the request
   */
  const retryPolicy = (data) => data instanceof DownstreamRateLimitExceeded;

  const retryWrapper = new SimpleRetryWrapper(retryMethod, {
    waitTime: DAY_MS,
    retries: 3,
    retryPolicy,
  });

  return retryWrapper.start();
}

/**
 * Sets the latest call time of this API
 */
function setLatestCallTime() {
  lastCallTimeMS = new Date().getTime();
  info('Updated last call time to: %s', lastCallTimeMS);
}
/**
 * Potentially does a wait if the API is called within the cooling down period
 */
async function conditionalWait() {
  const currentTimeMS = new Date().getTime();
  const timeUntilValid = lastCallTimeMS + MINIMUM_WAIT_BETWEEN_CALLS_MS;

  if (currentTimeMS < timeUntilValid) {
    info('Need to wait before calling API');

    const requiredWait = timeUntilValid - currentTimeMS;

    info('Sleeping for %s milliseconds', requiredWait);

    await sleep(requiredWait);
  }
}

/**
 * @typedef AlphaVantageApiResponse
 * @type {object}
 * @property {TickerMetaData} metaData - The meta data relating to the API response
 * @property {TickerDataPriceSeries} timeSeries - The meta data relating to the API response
 */

/**
 * @typedef StrippedAlphaVantageApiResponse
 * @type {object}
 * @property {string} ticker The meta data relating to the API response
 * @property {TickerDataPriceSeries} response The meta data relating to the API response
 */

/**
 * @typedef TickerMetaData
 * @type {object}
 * @property {string} information - String detailing what data we have.
 * @property {string} symbol - The ticker's key.
 * @property {string} lastRefreshed - Date the data was last refreshed.
 * @property {string} outputSize - Type of API response.
 * @property {string} timeZone - The time zone.
 */

/**
 * @typedef TickerDataPriceSeries
 * @type {object}
 * @property {object.<string, TickerPriceData>} timeSeriesDaily - An
 *  object containing all the price data
 */

/**
 * @typedef TickerPriceData
 * @type {object}
 * @property {string} open - The open price for the day
 * @property {string} high - The highest price for the day
 * @property {string} low - The lowest price for the day
 * @property {string} close -  The closing price for the day
 * @property {string} volume - The volume for the day
 */

/**
 * @typedef FormattedTickerPriceData
 * @type {object}
 * @property {string} id The ID used to store/fetch stock prices in the database
 * @property {string} ticker The ticker we're storing data for
 * @property {string} date The date associated with the price of the stock
 * @property {string} price The price of the stock for a given date
 */

/**
 * Method to parse the price data into something we can store in our database
 *
 * @param {StrippedAlphaVantageApiResponse} responseData Response from price data fetch
 * @returns {Array.<FormattedTickerPriceData>} An array of items to store later
 */
function processAlphavantageApiResponse(responseData) {
  const { ticker } = responseData;
  const { response } = responseData;

  return Object.keys(response).map((date) => ({
    id: `${ticker}-${date}`,
    ticker,
    date,
    price: response[date]['4. close'],
  }));
}

/**
 * Method to trim the full response down. Used in cases where we don't want to store
the entire price history of a stock
 *
 * @param {StrippedAlphaVantageApiResponse} responseData Response from price data fetch
 * @param {number} limitAmount Number of items to keep from the response
 * @returns {StrippedAlphaVantageApiResponse} The original data trimmed to size
 */
function trimResponse(responseData, limitAmount) {
  const { ticker } = responseData;
  const { response } = responseData;

  const priceSeries = Object.keys(response)
    .slice(0, limitAmount)
    .reduce((acc, date) => {
      acc[date] = response[date];
      return acc;
    }, {});

  return {
    ticker,
    response: priceSeries,
  };
}

/**
 * Method to fetch the historic price data for a given ticker
 *
 * @param {string} ticker - The ticker, e.g. GAW.L
 * @returns {StrippedAlphaVantageApiResponse} An object representing price data
 */
async function fetchTickerPriceData(ticker) {
  const url = buildApiUrl(ticker);

  return fetch(url)
    .then((res) => res.json())
    .then((resJson) => {
      validateApiResponse(resJson);
      return {
        ticker,
        response: resJson['Time Series (Daily)'],
      };
    });
}

/**
 * Method to build the API we'll call for the price data
 *
 * @param {string} ticker - The ticker, e.g. GAW.L
 * @returns {string} The URL to fetch price data with
 */
function buildApiUrl(ticker) {
  const baseURL = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&outputsize=full';
  const apiKey = ALPHA_VANTAGE_CREDENTIALS.key;
  const url = `${baseURL}&apikey=${apiKey}&symbol=${ticker}`;

  info('Using AlphaVantage URL: %s', url);

  return url;
}

/**
 * Method to validate the price data API response
 *
 * @param {AlphaVantageApiResponse} response The initial API response
 * @throws {DownstreamBadRequest} When the response indicates that AlphaVantage
 * couldn't return data because of the request data
 * @throws {DownstreamRateLimitExceeded} When the response indicates we're calling
 * AlphaVantage too much
 */
function validateApiResponse(response) {
  if (!response || response['Error Message']) {
    error('A bad request has been made to AlphaVantage, response: %O', response);
    throw new DownstreamBadRequest(
      `Appear to have made a bad request to AlphaVantage: ${JSON.stringify(response)}`,
    );
  }

  if (response.Information || response.Note) {
    error('Exceeded rate limit for AlphaVantage, response: %O', response);
    throw new DownstreamRateLimitExceeded(
      `Appear to have exceeded the rate limit with AlphaVantage: ${JSON.stringify(response)}`,
    );
  }
}

/**
 * A method for formatting the ticker into the format we
 will store the price data in the database
 *
 * @param {string} ticker Ticker to format
 * @returns {string} The ticker, formatted
 */
function formatTickerForCall(ticker) {
  return ticker.endsWith('.') ? `${ticker}L` : `${ticker}.L`;
}

export default fetchTickerPrices;
