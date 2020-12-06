import util from 'util';

import { SERVER_CACHE } from '../modules/data_structures';
import { API_STORAGE_KEYS, INDEXES_CONFIG, info } from '../modules/constants';
import { fetchTickers } from '../modules/fetch';
import { readCache, writeCache } from '../modules/cache';

/**
 * Method to fetch tickers data for all supported indexes
 */
async function updateTickersData() {
  info('Starting the tickers data update');

  const persistantCache = await readCache(API_STORAGE_KEYS.TICKERS);

  // use the S3 cache if we have data for today
  if (persistantCache) {
    info('Using S3 cache for server data');

    updateLocalStorage(persistantCache);

    return;
  }

  info('Manually fetching ticker data');

  const indexes = INDEXES_CONFIG.getSupportedTickersIndexes();

  info('Fetching tickers for these indexes: %O', indexes);

  const tickersData = await indexes.reduce(
    async (acc, index) => acc.then((data) => fetchTickers(index).then((tickers) => ({
      ...data,
      [index]: tickers,
    }))),
    Promise.resolve({}),
  );

  updateLocalStorage(tickersData);

  writeCache(API_STORAGE_KEYS.TICKERS, JSON.stringify(tickersData));
}

/**
 * Method to update local storage and log activity
 *
 * @param {object} data Data to store into local storage
 */
function updateLocalStorage(data) {
  SERVER_CACHE.storeData(API_STORAGE_KEYS.TICKERS, data);

  info(
    'Finished the tickers data update, new state of the cache: %O',
    util.inspect(SERVER_CACHE, { maxArrayLength: null, depth: 30 }),
  );
}

export default updateTickersData;
