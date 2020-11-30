import util from 'util';

import SERVER_CACHE from '../modules/data_structures';
import { API_STORAGE_KEYS, info } from '../modules/constants';
import { fetchFundamentalsData } from '../modules/fetch';
import { readCache, writeCache } from '../modules/cache';

/**
 * Method to fetch fundamentals data
 */
async function updateFundamentalsData() {
  info('Starting the fundamentals data update');

  const persistantCache = await readCache(API_STORAGE_KEYS.FUNDAMENTALS);

  // use the S3 cache if we have data for today
  if (persistantCache) {
    info('Using S3 cache for server data');

    updateLocalStorage(persistantCache);

    return;
  }

  const fundamentalsData = await fetchFundamentalsData();

  SERVER_CACHE.storeData(API_STORAGE_KEYS.FUNDAMENTALS, fundamentalsData);

  info(
    'Finished the fundamentals data update, new state of the cache: %O',
    util.inspect(SERVER_CACHE, { maxArrayLength: null, depth: 30 }),
  );

  writeCache(API_STORAGE_KEYS.FUNDAMENTALS, JSON.stringify(fundamentalsData));
}

/**
 * Method to update local storage and log activity
 *
 * @param {object} data Data to store into local storage
 */
function updateLocalStorage(data) {
  SERVER_CACHE.storeData(API_STORAGE_KEYS.FUNDAMENTALS, data);

  info(
    'Finished the fundamentals data update, new state of the cache: %O',
    util.inspect(SERVER_CACHE, { maxArrayLength: null, depth: 30 }),
  );
}

export default updateFundamentalsData;
