import fetch from 'node-fetch';
import { sleep } from 'noodle-utils';

import { ALPHA_VANTAGE_CREDENTIALS } from '../constants';
import { DownstreamBadRequest, DownstreamRateLimitExceeded } from '../errors';
import { SimpleRetryWrapper, NOTIFICATION_CENTRE } from '../utils';

const DAY_MS = 1000 * 60 * 60 * 24;
const MINIMUM_WAIT_BETWEEN_CALLS_MS = 14 * 1000;

let lastCallTimeMS = 0;

/**
 * Fetches the prices for a ticker
 *
 * @param {string} ticker The ticker to fetch data for
 * @returns {Array.<object>} An object holding the heatmap data, for multiple
 * time periods, for each stock in the given index
 */
async function fetchTickerPrices(ticker) {
  // if the API is called too soon after the last call we have to wait until the API
  // rate limit conditions are met (5 calls per minute)
  await conditionalWait();

  const formattedTicker = formatTickerForCall(ticker);

  NOTIFICATION_CENTRE.info(`Fetching data for ticker: ${formattedTicker}`);

  /**
   * Method to fetch price data
   *
   * @returns {Array.<object>} An object holding the heatmap data, for multiple
   * time periods, for each stock in the given index
   */
  const retryMethod = async () => fetchTickerPriceData(formattedTicker).then(async (priceData) => {
    NOTIFICATION_CENTRE.info(
      `For ticker: ${formattedTicker}, fetched this many items: ${
        Object.keys(priceData.response).length
      }`,
    );

    const processedResponse = processAlphavantageApiResponse(priceData);

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
  NOTIFICATION_CENTRE.info(`Updated last call time to: ${lastCallTimeMS}`);
}

/**
 * Potentially does a wait if the API is called within the cooling down period
 */
async function conditionalWait() {
  const currentTimeMS = new Date().getTime();
  const timeUntilValid = lastCallTimeMS + MINIMUM_WAIT_BETWEEN_CALLS_MS;

  if (currentTimeMS < timeUntilValid) {
    NOTIFICATION_CENTRE.info('Need to wait before calling API');

    const requiredWait = timeUntilValid - currentTimeMS;

    NOTIFICATION_CENTRE.info(`Sleeping for ${requiredWait} milliseconds`);

    await sleep(requiredWait);
  }
}

/**
 * Parse the price data into something we can store in our database
 *
 * @param {object} responseData Response from price data fetch
 * @returns {Array.<object>} An array of items to store later
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
 * Fetch the historic price data for a given ticker
 *
 * @param {string} ticker - The ticker, e.g. GAW.L
 * @returns {object} An object representing price data
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
 * Build the API we'll call for the price data
 *
 * @param {string} ticker - The ticker, e.g. GAW.L
 * @returns {string} The URL to fetch price data with
 */
function buildApiUrl(ticker) {
  const baseURL = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&outputsize=full';
  const apiKey = ALPHA_VANTAGE_CREDENTIALS.key;
  const url = `${baseURL}&apikey=${apiKey}&symbol=${ticker}`;

  NOTIFICATION_CENTRE.info(`Using AlphaVantage URL: ${url}`);

  return url;
}

/**
 * Validate the price data API response
 *
 * @param {object} response The initial API response
 * @throws {DownstreamBadRequest} When the response indicates that AlphaVantage
 * couldn't return data because of the request data
 * @throws {DownstreamRateLimitExceeded} When the response indicates we're calling
 * AlphaVantage too much
 */
function validateApiResponse(response) {
  if (!response || response['Error Message']) {
    NOTIFICATION_CENTRE.error(`A bad request has been made to AlphaVantage, response: ${response}`);
    throw new DownstreamBadRequest(
      `Appear to have made a bad request to AlphaVantage: ${JSON.stringify(response)}`,
    );
  }

  if (response.Information || response.Note) {
    NOTIFICATION_CENTRE.error(`Exceeded rate limit for AlphaVantage, response: ${response}`);
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
