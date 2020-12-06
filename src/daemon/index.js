import schedule from 'node-schedule';

import { MAIL_CLIENT, info } from '../modules/constants';
import updateTickersData from './tickers';
import updateFundamentalsData from './fundamentals';
import updateHeatmapsData from './heatmaps';
import { updateRecentPricesData } from './prices';

/**
 * A method to setup a schedule for the API data
 */
async function updateServiceData() {
  // always run this on the first call to ensure that the store is populated
  // on service start
  await main();

  // update is scheduled to run every three days at midnight
  schedule.scheduleJob('0 0 0 */3 * *', async () => {
    try {
      await main();
    } catch (e) {
      await MAIL_CLIENT.sendMail('Failed to update the StockAPI data!', '');
    }
  });
}

/**
 * The method to run all of the data updaters
 */
async function main() {
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
}

export default updateServiceData;
