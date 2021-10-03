/* eslint-disable no-await-in-loop */

import moment from 'moment';

import { DynamoReadBatch } from 'noodle-utils';
import { AWS_CREDENTIALS } from '../constants';

const TODAY_DATE_NORMALISATION_AMOUNT = 5;
const TIME_PERIOD_MAPPING = Object.freeze({
  ONE_MONTH: 30,
  THREE_MONTH: 90,
  SIX_MONTH: 180,
  ONE_YEAR: 360,
  TWO_YEAR: 720,
});
const DYNAMO_TABLE_NAME = 'TickerData';
const DYNAMO_TABLE_REGION = 'us-east-2';

const MAX_RETRY_TICKERS = 10;
const MAX_RETRY_DATES = 10;

/**
 * Generates a heatmap for a set of given tickers
 *
 * @param {Array<string>} tickers The tickers to create a heatmap for
 * @returns {object} An object holding the heatmap data, for multiple
 time periods, for each stock in the given index
 */
async function generateHeatmap(tickers) {
  // we have to go back a few days from today becuase there's no way of guaranteeing
  // that every stock will have data for today's date. Everything should have data
  // starting from {TODAY_DATE_NORMALISATION_AMOUNT} days ago though
  const todayHeatmapData = await fetchHeatmapDataForDate(
    moment().subtract(TODAY_DATE_NORMALISATION_AMOUNT, 'days'),
    tickers,
  );

  const heatmapData = {};

  for (let i = 0; i < Object.keys(TIME_PERIOD_MAPPING).length; i += 1) {
    const currentTimePeriodKey = Object.keys(TIME_PERIOD_MAPPING)[i];
    const currentTimePeriodDays = TIME_PERIOD_MAPPING[currentTimePeriodKey];

    const targetDate = moment().subtract(currentTimePeriodDays, 'days');

    const targetHeatmapData = await fetchHeatmapDataForDate(targetDate, tickers);

    const data = generateHeatmapPrices(todayHeatmapData, targetHeatmapData);

    heatmapData[currentTimePeriodKey] = {
      ...heatmapData[currentTimePeriodKey],
      data,
    };
  }

  return heatmapData;
}

/**
 * Will generate the price differences between today and the target date
 *
 * @param {object} todayData Data for today
 * @param {object} targetData Data for the target date
 * @returns {object} Heatmap API response including ticker and change properties
 */
function generateHeatmapPrices(todayData, targetData) {
  const tickers = Object.keys(todayData);

  const heatmapData = tickers
    .map((ticker) => {
      const today = todayData[ticker];
      const target = targetData[ticker];

      const isTodayError = today.length !== 1 || today instanceof Error;
      const isTargetError = target.length !== 1 || target instanceof Error;

      return isTodayError || isTargetError
        ? undefined
        : {
          ticker,
          change: (today[0].price / target[0].price) * 100 - 100,
        };
    })
    .filter((x) => x);

  return heatmapData;
}

/**
 * A method for formatting the ticker into the format we've
 stored the price data in the database
 *
 * @param {string} ticker Ticker to format
 * @returns {string} The ticker formatted for a database read
 */
function formatTickerForRead(ticker) {
  return ticker.endsWith('.') ? `${ticker}L` : `${ticker}.L`;
}

/**
 * Will fetch all of the Heatmap data for a set of tickers, for today
 *
 * @param {moment} date The date we want to fetch price data for
 * @param {Array.<string>} tickers The tickers we want heatmap data for
 * @returns {object} An object containing all price data for a given date
 */
async function fetchHeatmapDataForDate(date, tickers) {
  const batchReader = new DynamoReadBatch(AWS_CREDENTIALS, DYNAMO_TABLE_REGION, DYNAMO_TABLE_NAME);

  const targetDate = await findNearestDateWithData(batchReader, date, tickers);

  const heatmapDateReadItems = createDynamoReadItems(targetDate, tickers);

  const data = await batchReader.readItems(heatmapDateReadItems);

  return data;
}

/**
 * Creates the read items based on the tickers we want data for
 *
 * @param {moment} date The date we want to fetch price data for
 * @param {Array.<string>} tickers The tickers we want heatmap data for
 * @returns {object} An object representing read data for the DynamoBatch class
 */
function createDynamoReadItems(date, tickers) {
  const formattedDate = date.format('YYYY-MM-DD');

  return tickers.map((ticker) => ({
    expression: 'id = :id',
    expressionData: {
      ':id': `${formatTickerForRead(ticker)}-${formattedDate}`,
    },
    key: ticker,
  }));
}

/**
 * Method used to find which date we should use to base our heatmap on. If
 * the date falls on a weekend, we won't find any data to use, so we trace
 * back up to a maximum until we find data. The assumption is that if we find
 * information for a price for one stock, we'll find it for all the others. We
 * can only make this assumption because we always start the search from at least
 * {TODAY_DATE_NORMALISATION_AMOUNT} days away
 *
 * @param {object} batchReader Class used to read dynamo data
 * @param {moment} date Date used to start the search with
 * @param {Array<string>} tickers The tickers used to find data for
 * @throws {Error} When we can't find a date to work with
 * @returns {moment} A date object to use for our heatmap data
 */
async function findNearestDateWithData(batchReader, date, tickers) {
  for (let tickerIndex = 0; tickerIndex < MAX_RETRY_TICKERS; tickerIndex += 1) {
    const ticker = tickers[tickers.length - tickerIndex - 1];
    const tempDate = date;

    for (let dateIndex = 0; dateIndex < MAX_RETRY_DATES; dateIndex += 1) {
      const readItem = createDynamoReadItems(tempDate, [ticker]);
      const data = await batchReader.readItems(readItem);

      const dataValues = Object.values(data);

      if (dataValues.length === 1 && !(dataValues[0] instanceof Error)) {
        return tempDate;
      }

      tempDate.subtract(1, 'days');
    }
  }

  throw new Error('Failed to find a date to base heatmap from');
}

export default generateHeatmap;
