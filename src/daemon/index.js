import schedule from 'node-schedule';

import getInternalData from '../modules/data';

import { MAIL_CLIENT } from '../modules/constants';

/**
 * Schedules regular cache updates
 */
async function scheduleUpdates() {
  const internalData = await getInternalData();

  schedule.scheduleJob('0 0 0 */3 * *', async () => {
    MAIL_CLIENT.sendMail('Starting StockAPI cache update!', '');
    await internalData.updateFundamentalsCache();
    MAIL_CLIENT.sendMail('Starting the tickers cache update!', '');
    await internalData.updateTickersCache();
    MAIL_CLIENT.sendMail('Starting the prices cache update!', '');
    await internalData.updatePriceData();
    MAIL_CLIENT.sendMail('Starting the heatmaps cache update!', '');
    await internalData.updateHeatmapCache();
    MAIL_CLIENT.sendMail('Finished StockAPI cache update!', '');
  });
}

export default scheduleUpdates;
