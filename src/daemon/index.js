/* eslint-disable no-async-promise-executor */

import schedule from 'node-schedule';

import { MAIL_CLIENT, info } from '../modules/constants';
import updateTickersData from './tickers';
import updateFundamentalsData from './fundamentals';
import updateHeatmapsData from './heatmaps';
import { updateHistoricPricesData } from './prices';

/**
 * A method to setup a schedule for the API data
 */
async function updateServiceData() {
  // always run this on the first call to ensure that the store is populated
  // on service start
  updateLocalData().catch((e) => {
    MAIL_CLIENT.sendMail('Failed to update local StockAPI data!', e.toString());
  });

  // update is scheduled to run every seven days at midnight
  schedule.scheduleJob('0 0 0 */7 * *', async () => {
    main().catch((e) => {
      MAIL_CLIENT.sendMail('Failed to update the StockAPI data!', e.toString());
    });
  });
}

/**
 * The method to run all of the data updaters
 *
 * @returns {Promise.<void>} A promise to handle errors on
 */
async function main() {
  return new Promise(async (resolve, reject) => {
    try {
      await MAIL_CLIENT.sendMail('Starting to update the long-term StockAPI Data!', '');

      info('Starting price data update');
      await updateHistoricPricesData();

      info('Starting local data update');
      await updateLocalData();

      await MAIL_CLIENT.sendMail('Finished updating the long-term StockAPI data!', '');

      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Updates the local API's data using either current long term storage, or "lightweight"
 fetches
 *
 * @returns {Promise.<void>} A promise to handle errors on
 */
async function updateLocalData() {
  return new Promise(async (resolve, reject) => {
    try {
      await MAIL_CLIENT.sendMail('Starting to update the local StockAPI Data!', '');

      info('Starting tickers data update');
      await updateTickersData();
      info('Starting fundamentals data update');
      await updateFundamentalsData();
      info('Starting heatmap data update');
      await updateHeatmapsData();

      await MAIL_CLIENT.sendMail('Finished updating the local StockAPI Data!', '');

      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

export default updateServiceData;
