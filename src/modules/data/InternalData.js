/* eslint-disable class-methods-use-this */
import fetchTickers from './tickers';
import { fetchSupportedIndexes } from './indexes';

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
