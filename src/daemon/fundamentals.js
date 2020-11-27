import util from 'util';

import SERVER_CACHE from '../modules/data_structures';
import { API_STORAGE_KEYS, info } from '../modules/constants';
import { fetchFundamentalsData } from '../modules/fetch';

/**
 * Method to fetch fundamentals data
 */
async function updateFundamentalsData() {
  info('Starting the fundamentals data update');

  const fundamentalsData = await fetchFundamentalsData();

  SERVER_CACHE.storeData(API_STORAGE_KEYS.FUNDAMENTALS, fundamentalsData);

  info(
    'Finished the fundamentals data update, new state of the cache: %O',
    util.inspect(SERVER_CACHE, { maxArrayLength: null, depth: 30 }),
  );
}

export default updateFundamentalsData;
