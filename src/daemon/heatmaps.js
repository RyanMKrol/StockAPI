import util from 'util';

import SERVER_CACHE from '../modules/data_structures';
import { API_STORAGE_KEYS, INDEXES_CONFIG, info } from '../modules/constants';
import { fetchHeatmap } from '../modules/fetch';

/**
 * Method to fetch heatmaps data
 */
async function updateHeatmapsData() {
  info('Starting the fundamentals data update');

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
}

export default updateHeatmapsData;
