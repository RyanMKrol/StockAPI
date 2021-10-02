import moment from 'moment';
import { readData, writeData } from './s3';

const STOCK_CACHE_BUCKET_NAME = 'stock-api-cache';

/**
 * Attempts to find cache data for the given object name
 *
 * @param {string} objectName The name of the cache to read
 * @param {number} ttlDays The number of days to scan back looking for cache data
 * @returns {JSON} The cached data
 */
async function readCache(objectName, ttlDays) {
  for (let i = 0; i < ttlDays; i += 1) {
    const cacheObjectName = fetchCacheId(objectName, i);

    try {
      // recommendation to disable when loop iterations are dependent on each other
      // https://eslint.org/docs/rules/no-await-in-loop
      /* eslint-disable-next-line no-await-in-loop */
      const cacheData = await readData(STOCK_CACHE_BUCKET_NAME, cacheObjectName);
      return cacheData;
    } catch (e) {
      console.log(
        `Failed to find cache data for this name: ${cacheObjectName}, with this error: ${e}`,
      );
    }
  }

  return undefined;
}

/**
 * Writes out today's cache data
 *
 * @param {string} objectName The name of the cache to write
 * @param {JSON} data The data to write
 * @returns {Promise<any>} S3 response from writing
 */
async function writeCache(objectName, data) {
  return writeData(STOCK_CACHE_BUCKET_NAME, fetchCacheId(objectName, 0), data);
}

/**
 * Create a key to use for read/writes of cache data
 *
 * @param {string} key The initial cache key name
 * @param {number} walkbackDays The number of days to walk back. Used when
 * seeking a key that actually exists. We'll walk back x days until we're
 * confident no relevant cache exists for us to use.
 * @returns {string} The key to use in the database
 */
function fetchCacheId(key, walkbackDays) {
  const todayDate = moment()
    .subtract(walkbackDays, 'days')
    .format('YYYY-MM-DD');
  return `${key}-${todayDate}`;
}

export { readCache, writeCache };
