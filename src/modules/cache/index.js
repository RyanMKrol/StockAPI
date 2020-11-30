import moment from 'moment';

import AWS from 'aws-sdk';
import * as utils from 'noodle-utils';
import { AWS_CREDENTIALS } from '../constants';

const STOCK_CACHE_BUCKET_NAME = 'stock-api-cache';

/**
 * Method to read cache data
 *
 * @param {string} cacheType The type of cache data we're reading
 * @returns {object} The data stored in the database
 */
async function readCache(cacheType) {
  AWS.config.update(AWS_CREDENTIALS);

  const fileName = fetchTodaysCacheId(cacheType);

  const params = {
    Bucket: STOCK_CACHE_BUCKET_NAME,
    Key: fileName,
  };

  return new Promise((resolve, reject) => {
    new AWS.S3().getObject(params, (error, data) => {
      if (error && error.statusCode !== 404) reject(error);

      utils.isUndefined(data) ? resolve() : resolve(JSON.parse(JSON.parse(data.Body)));
    });
  });
}

/**
 * Method to persist cache data
 *
 * @param {string} cacheType The type of cache data we're writing
 * @param {object} data The data to write to the database
 */
async function writeCache(cacheType, data) {
  AWS.config.update(AWS_CREDENTIALS);

  const fileName = fetchTodaysCacheId(cacheType);

  const params = {
    Bucket: STOCK_CACHE_BUCKET_NAME,
    Key: fileName,
    Body: JSON.stringify(data),
  };

  return new Promise((resolve, reject) => {
    new AWS.S3().upload(params, (error, response) => {
      if (error) reject(error);
      resolve(response);
    });
  });
}

/**
 * Create a key to use for read/writes of cache data
 *
 * @param {string} key The type of cache we want to fetch
 * @returns {string} The key to use in the database
 */
function fetchTodaysCacheId(key) {
  const todayDate = moment().format('YYYY-MM-DD');
  return `${key}-${todayDate}`;
}

export { readCache, writeCache };
