/* eslint-disable class-methods-use-this */
import { sleep, DynamoWriteQueue } from 'noodle-utils';
import fetchTickers from './tickers';
import { fetchSupportedIndexes } from './indexes';
import getPriceHistory from './prices';
import fetchFundamentalsData from './fundamentals';
import fetchHeatmapData from './heatmaps';
import { readCache, writeCache } from './private/cache';
import { AWS_CREDENTIALS, MAIL_CLIENT } from '../constants';

const DYNAMO_TABLE_NAME = 'TickerData';
const DYNAMO_TABLE_REGION = 'us-east-2';
const WRITE_QUEUE = new DynamoWriteQueue(AWS_CREDENTIALS, DYNAMO_TABLE_REGION, DYNAMO_TABLE_NAME);

const MAX_ITEM_WRITES = 600;
const DYNAMO_STORAGE_WRITE_WAIT_MS = 2.5 * 1000 * 60;

const CACHE_TIMEOUT_DAYS = 1;
const TICKERS_CACHE_NAME = 'tickers';
const FUNDAMENTALS_CACHE_NAME = 'fundamentals';
const HEATMAPS_CACHE_NAME = 'heatmaps';

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
   * Update the local and long term cache for heatmaps
   */
  async updatePriceData() {
    await this.updateTickersCache();
    const tickers = Object.values(this.store.TICKERS).reduce((acc, indexTickers) => [
      ...acc,
      ...indexTickers,
    ]);

    // In total there are roughly 2,000 companies that need data. We want to get around
    // 2 years worth of data, call this 600 items per company. The dynamo write queue
    // writes 5 items per 1.2 seconds (to ensure we don't exceed 5 WCU per table, and
    // to avoid paying for Dynamo). 2,000*600/5*1.2 = 240,000 seconds, 4,000 minutes,
    // ~67 hours, < 3 days
    await tickers.reduce(
      async (acc, ticker) => acc.then(async () => {
        const data = await getPriceHistory(ticker);

        if (data instanceof Error) {
          await MAIL_CLIENT.sendMail(
            `Received an error for this ticker: ${ticker}, data: ${data}`,
            data,
          );
        } else {
          const truncatedData = data.slice(0, MAX_ITEM_WRITES);
          WRITE_QUEUE.pushBatch(truncatedData);
        }

        // With 600 items to write per company, we write 5 every 1.2 seconds, so it
        // should take 600 / 5 * 1.2 this will take around 144 seconds, or just under
        // 2.5 minutes. We'll wait 2.5 minutes between fetches to ensure that the
        // queue doesn't just grow forever
        await sleep(DYNAMO_STORAGE_WRITE_WAIT_MS);
      }),
      Promise.resolve(),
    );
  }

  /**
   * Get heatmap of stocks in a given index
   *
   * @param {string} index index
   * @returns {Array<string>} The fundamentals data
   */
  getHeatmap(index) {
    if (typeof this.store.HEATMAPS[index] === 'undefined') {
      throw Error('Data not found');
    }

    return this.store.HEATMAPS[index];
  }

  /**
   * Update the local and long term cache for heatmaps
   */
  async updateHeatmapCache() {
    const indexes = fetchSupportedIndexes();

    const cacheData = await indexes.reduce(
      async (acc, val) => acc.then(async (data) => {
        /* eslint-disable-next-line no-param-reassign */
        data[val] = await fetchHeatmapData(val);
        return data;
      }),
      Promise.resolve({}),
    );

    this.store.HEATMAPS = cacheData;
    writeCache(HEATMAPS_CACHE_NAME, JSON.stringify(cacheData));
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
  const heatmapsData = await readCache(HEATMAPS_CACHE_NAME, CACHE_TIMEOUT_DAYS);

  const cacheData = {
    TICKERS: tickersData || {},
    FUNDAMENTALS: fundamentalsData || {},
    HEATMAPS: heatmapsData || {},
  };

  instance = new InternalData(cacheData);

  return instance;
}

export default getInternalData;
