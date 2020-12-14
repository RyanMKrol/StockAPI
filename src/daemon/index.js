import schedule from 'node-schedule';
import semaphore from 'semaphore';

import { MAIL_CLIENT, info } from '../modules/constants';
import updateTickersData from './tickers';
import updateFundamentalsData from './fundamentals';
import updateHeatmapsData from './heatmaps';
import { updateRecentPricesData } from './prices';

// will be used to lock the main function to one call at a time
const sem = semaphore(1);

/**
 * A method to setup a schedule for the API data
 */
async function updateServiceData() {
  // always run this on the first call to ensure that the store is populated
  // on service start
  main().catch((e) => {
    MAIL_CLIENT.sendMail('Failed to update the StockAPI data!', e.toString());
  });

  // update is scheduled to run every three days at midnight
  schedule.scheduleJob('0 0 0 * * *', async () => {
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
  return new Promise((resolve, reject) => {
    sem.take(async () => {
      try {
        await MAIL_CLIENT.sendMail('Starting to update the StockAPI Data!', '');

        // daemon's that update the local API data take priority
        info('Starting tickers data update');
        await updateTickersData();
        info('Starting fundamentals data update');
        await updateFundamentalsData();
        info('Starting heatmap data update');
        await updateHeatmapsData();

        // daemon's that don't directly influence the API response can start later
        info('Starting price data update');
        await updateRecentPricesData(MAIL_CLIENT);

        await MAIL_CLIENT.sendMail('Finished updating the StockAPI data!', '');

        resolve();
      } catch (e) {
        reject(e);
      } finally {
        sem.leave();
      }
    });
  });
}

export default updateServiceData;
