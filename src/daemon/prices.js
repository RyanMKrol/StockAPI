import { DynamoWriteQueue } from 'noodle-utils';
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

const writeQueue = new DynamoWriteQueue(AWS_CREDENTIALS, DYNAMO_REGION, DYNAMO_TABLE);

/**
 * Method to fetch and store only recent price data
 */
async function updateRecentPricesData() {
  await updatePricesData(RECENT_ITEM_COUNT);
}

/**
 * Method to fetch and store all historic price data
 */
async function updateHistoricPricesData() {
  await updatePricesData();
}

/**
 * Method to fetch and store price data
 *
 * @param {number} [daysToRestrict] The number of items to store per stock. If
 * none is passed, we store everything
 */
async function updatePricesData(daysToRestrict) {
  const indexes = INDEXES_CONFIG.getPricesIndexes();

  info('Starting the price data update');

  await indexes.reduce(
    async (accumulatorOuter, stockIndex) => accumulatorOuter.then(async () => {
      info('Going through this index: %s', stockIndex);

      const tickers = (await fetchTickers(stockIndex)).sort();

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
        }),
        Promise.resolve(),
      );
    }),
    Promise.resolve(),
  );

  info('Finishing the price data update');
}

export { updateRecentPricesData, updateHistoricPricesData };
