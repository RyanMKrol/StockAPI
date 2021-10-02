/* eslint-disable class-methods-use-this */
import fetchTickers from './tickers';
import { fetchSupportedIndexes } from './indexes';
import getPriceHistory from './prices';
import fetchFundamentalsData from './fundamentals';
import { readCache, writeCache } from './private/cache';

const CACHE_TIMEOUT_DAYS = 10;
const TICKERS_CACHE_NAME = 'tickers';
const FUNDAMENTALS_CACHE_NAME = 'fundamentals';

/**
 * InternalData
 *
 * A facade for accessing the internal cache that will respond to actual requests
 */
class InternalData {
  /**
   * constructor
   *
   * @param {object} cacheData A local representation of the cache
   */
  constructor(cacheData) {
    this.store = cacheData;
  }

  /**
   * Get indexes supported by the API
   *
   * @returns {Array<string>} The supported indexes
   */
  getIndexes() {
    return fetchSupportedIndexes();
  }

  /**
   * Get price history for a ticker
   *
   * @param {string} ticker ticker
   * @returns {Array<string>} The supported indexes
   */
  getPriceHistory(ticker) {
    return getPriceHistory(ticker);
  }

  /**
   * Get fundamentals of stocks in a given index
   *
   * @param {string} index index
   * @returns {Array<string>} The fundamentals data
   */
  getFundamentals(index) {
    if (typeof this.store.FUNDAMENTALS[index] === 'undefined') {
      throw Error('Data not found');
    }

    return this.store.FUNDAMENTALS[index];
  }

  /**
   * Update the local and long term cache for fundamentals
   */
  async updateFundamentalsCache() {
    const indexes = fetchSupportedIndexes();

    const cacheData = await indexes.reduce(
      async (acc, val) => acc.then(async (data) => {
        /* eslint-disable-next-line no-param-reassign */
        data[val] = await fetchFundamentalsData(val);
        return data;
      }),
      Promise.resolve({}),
    );

    this.store.FUNDAMENTALS = cacheData;
    writeCache(FUNDAMENTALS_CACHE_NAME, JSON.stringify(cacheData));
  }

  /**
   * Get tickers for a given index, and cache the results
   *
   * @param {string} index The index to get tickers for
   * @returns {Array<string>} The tickers for the index
   * @throws When tickers data is unavailable
   */
  getTickers(index) {
    if (typeof this.store.TICKERS[index] === 'undefined') {
      throw Error('Data not found');
    }

    return this.store.TICKERS[index];
  }

  /**
   * Update the local and long term cache for tickers
   */
  async updateTickersCache() {
    const indexes = fetchSupportedIndexes();

    const cacheData = await indexes.reduce(
      async (acc, val) => acc.then(async (data) => {
        /* eslint-disable-next-line no-param-reassign */
        data[val] = await fetchTickers(val);
        return data;
      }),
      Promise.resolve({}),
    );

    this.store.TICKERS = cacheData;
    writeCache(TICKERS_CACHE_NAME, JSON.stringify(cacheData));
  }
}

let instance;

/**
 * Gets a singleton of InternalData
 *
 * @returns {InternalData} An instance of InternalData
 */
async function getInternalData() {
  if (instance) {
    return instance;
  }

  const tickersData = await readCache(TICKERS_CACHE_NAME, CACHE_TIMEOUT_DAYS);
  const fundamentalsData = await readCache(FUNDAMENTALS_CACHE_NAME, CACHE_TIMEOUT_DAYS);

  const cacheData = {
    TICKERS: tickersData || {},
    FUNDAMENTALS: fundamentalsData || {},
  };

  instance = new InternalData(cacheData);

  return instance;
}

export default getInternalData;
