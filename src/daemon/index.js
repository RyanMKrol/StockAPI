/* eslint-disable no-await-in-loop */

import schedule from 'node-schedule';
import MailSender from 'noodle-email';

import { GMAIL_CREDENTIALS } from '../modules/constants';
import updateTickersData from './tickers';

const mailClient = new MailSender(GMAIL_CREDENTIALS);
mailClient.setFrom('"StockAPI" <ryankrol.m@gmail.com>');
mailClient.setTo('ryankrol.m@gmail.com');

/**
 * A method to setup a schedule for the API data
 */
async function updateServiceData() {
  // always run this on the first call to ensure that the store is populated
  // on service start
  main();

  // update is scheduled to run every day at midnight
  schedule.scheduleJob('0 0 0 * * *', async () => {
    try {
      await mailClient.sendMail('Starting to update the StockAPI Data!', '');
      await main();
      await mailClient.sendMail('Finished updating the StockAPI data!', '');
    } catch (e) {
      await mailClient.sendMail('Failed to update the StockAPI data!', '');
    }
  });
}

/**
 * The method to run all of the data updaters
 */
async function main() {
  await updateTickersData();
}

export default updateServiceData;
