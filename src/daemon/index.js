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
    await internalData.updateTickersCache();
    await internalData.updatePriceData();

    MAIL_CLIENT.sendMail('Finished StockAPI cache update!', '');
  });
}

export default scheduleUpdates;
