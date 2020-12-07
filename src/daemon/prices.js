import { sleep, DynamoWriteQueue } from 'noodle-utils';
import {
  MAIL_CLIENT,
  INDEXES_CONFIG,
  AWS_CREDENTIALS,
  DYNAMO_REGION,
  info,
  error,
} from '../modules/constants';
import { fetchPrices, fetchTickers } from '../modules/fetch';

const RECENT_ITEM_COUNT = 10;
const DYNAMO_TABLE = 'TickerData';

// we wait for 10 mins when writing a complete history to the DB because we'll end
// up using a huge amount of memory keeping everything locally while waiting to push
// to the DB otherwise
const WRITE_WAIT_MS = 1000 * 60 * 10;

const writeQueue = new DynamoWriteQueue(AWS_CREDENTIALS, DYNAMO_REGION, DYNAMO_TABLE);

/**
 * Method to fetch and store only recent price data
 */
async function updateRecentPricesData() {
  await updatePricesData(0, RECENT_ITEM_COUNT);
}

/**
 * Method to fetch and store all historic price data
 */
async function updateHistoricPricesData() {
  await updatePricesData(WRITE_WAIT_MS);
}

/**
 * Method to fetch and store price data
 *
 * @param {number} [optionalWait] Time to wait between writing to DB
 * @param {number} [daysToRestrict] The number of items to store per stock. If
 * none is passed, we store everything
 */
async function updatePricesData(optionalWait, daysToRestrict) {
  const indexes = INDEXES_CONFIG.getPricesIndexes();

  info('Starting the price data update');

  await indexes.reduce(
    async (accumulatorOuter, stockIndex) => accumulatorOuter.then(async () => {
      info('Going through this index: %s', stockIndex);

      const tickers = await fetchTickers(stockIndex);

      info('Tickers fetched');

      await tickers.reduce(
        async (accumulatorInner, ticker) => accumulatorInner.then(async () => {
          info('Fetching prices for ticker: %s', ticker);
          const data = daysToRestrict
            ? await fetchPrices(ticker, daysToRestrict)
            : await fetchPrices(ticker);

          if (data instanceof Error) {
            await MAIL_CLIENT.sendMail(
              `Received an error for this ticker: ${ticker}, data: ${data}`,
            );
            error('Received an error for this ticker: %s, data: %O', ticker, data);
          } else {
            info('Storing data for ticker: %s', ticker);
            writeQueue.pushBatch(data);
          }

          await sleep(optionalWait);
        }),
        Promise.resolve(),
      );
    }),
    Promise.resolve(),
  );

  info('Finishing the price data update');
}

export { updateRecentPricesData, updateHistoricPricesData };
