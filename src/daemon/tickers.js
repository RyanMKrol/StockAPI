import SERVER_CACHE from '../modules/data_structures';
import { API_STORAGE_KEYS, INDEXES_CONFIG, info } from '../modules/constants';
import { fetchTickers } from '../modules/fetch';

/**
 * Method to fetch tickers data for all supported indexes
 */
async function updateTickersData() {
  info('Starting the tickers data update');

  const indexes = INDEXES_CONFIG.getSupportedTickersIndexes();

  info('Fetching tickers for these indexes: %O', indexes);

  const tickersData = await Promise.all(
    indexes.map(async (index) => {
      const tickers = await fetchTickers(index);
      return {
        [index]: tickers,
      };
    }),
  );

  info('Storing the following tickers data: %O', tickersData);

  SERVER_CACHE.storeData(API_STORAGE_KEYS.TICKERS, tickersData);

  info('Finished the tickers data update');
}

export default updateTickersData;
