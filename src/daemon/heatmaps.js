import util from 'util';

import { SERVER_CACHE } from '../modules/data_structures';
import { API_STORAGE_KEYS, INDEXES_CONFIG, info } from '../modules/constants';
import { fetchHeatmap } from '../modules/fetch';
import { readCache, writeCache } from '../modules/cache';

/**
 * Method to fetch heatmaps data
 */
async function updateHeatmapsData() {
  info('Starting the heatmaps data update');

  const persistantCache = await readCache(API_STORAGE_KEYS.HEATMAPS);

  // use the S3 cache if we have data for today
  if (persistantCache) {
    info('Using S3 cache for server data');

    updateLocalStorage(persistantCache);

    return;
  }

  const supportedIndexes = INDEXES_CONFIG.getHeatmapsIndexes();

  const heatmapData = await supportedIndexes.reduce(
    async (acc, index) => acc.then((data) => fetchHeatmap(index).then((heatmap) => ({
      ...data,
      [index]: heatmap,
    }))),
    Promise.resolve({}),
  );

  info('Finished with the heatmap fetches, storing the data now');

  SERVER_CACHE.storeData(API_STORAGE_KEYS.HEATMAPS, heatmapData);

  info(
    'Finished the heatmaps data update, new state of the cache: %O',
    util.inspect(SERVER_CACHE, { maxArrayLength: null, depth: 30 }),
  );

  writeCache(API_STORAGE_KEYS.HEATMAPS, JSON.stringify(heatmapData));
}

/**
 * Method to update local storage and log activity
 *
 * @param {object} data Data to store into local storage
 */
function updateLocalStorage(data) {
  SERVER_CACHE.storeData(API_STORAGE_KEYS.HEATMAPS, data);

  info(
    'Finished the heatmaps data update, new state of the cache: %O',
    util.inspect(SERVER_CACHE, { maxArrayLength: null, depth: 30 }),
  );
}

export default updateHeatmapsData;
