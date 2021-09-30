/* eslint-disable class-methods-use-this */
import fetchTickers from './tickers';
import { fetchSupportedIndexes } from './indexes';
import getPriceHistory from './prices';
import fetchFundamentalsData from './fundamentals';

/**
 * InternalData
 *
 * A facade for accessing the internal cache that will respond to actual requests
 */
class InternalData {
  /**
   * constructor
   */
  constructor() {
    this.resetCache();
  }

  /**
   * Busts the cache, ensuring that the next fetch will populate with new data
   */
  resetCache() {
    this.store = {
      TICKERS: {},
      FUNDAMENTALS: {},
    };
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
  async getFundamentals(index) {
    if (typeof this.store.FUNDAMENTALS[index] === 'undefined') {
      const tickers = await fetchFundamentalsData(index);
      this.store.FUNDAMENTALS[index] = tickers;
    }

    return this.store.FUNDAMENTALS[index];
  }

  /**
   * Get tickers for a given index, and cache the results
   *
   * @param {string} index The index to get tickers for
   * @returns {Array<string>} The tickers for the index
   */
  async getTickers(index) {
    if (typeof this.store.TICKERS[index] === 'undefined') {
      const tickers = await fetchTickers(index);
      this.store.TICKERS[index] = tickers;
    }

    return this.store.TICKERS[index];
  }
}

const INTERNAL_DATA = new InternalData();
export default INTERNAL_DATA;
