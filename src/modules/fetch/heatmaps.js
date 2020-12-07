/* eslint-disable no-await-in-loop */

import moment from 'moment';
import util from 'util';

import { DynamoReadBatch } from 'noodle-utils';
import {
  AWS_CREDENTIALS, DYNAMO_REGION, SUPPORTED_TIME_PERIODS, info,
} from '../constants';
import { MissingDynamoData } from '../errors';
import fetchTickers from './tickers';

// Table where ticker data is kept
const DYNAMO_TABLE = 'TickerData';

// How far back we'll go from a given date to find a date we have data for
const MAX_RETRY_DATES = 10;

/**
 * The default value from the moment import
 *
 * @typedef Moment
 */

/**
 * Main
 *
 * @param {string} index The index to fetch heatmap data for
 * @returns {object} An object holding the heatmap data, for multiple
 time periods, for each stock in the given index
 */
async function main(index) {
  info('Starting the fetch for a heatmap');

  const timePeriods = Object.keys(SUPPORTED_TIME_PERIODS);

  const tickers = await fetchTickers(index);

  info('Fetching heatmap data for today');

  const todayDate = fetchTodayHeatmapDate();
  const todayHeatmapData = await fetchHeatmapDataForDate(todayDate, tickers);

  info('Heatmap prices for today: %O', util.inspect(todayHeatmapData, { maxArrayLength: null }));

  const heatmapData = {};

  for (let i = 0; i < timePeriods.length; i += 1) {
    const currentTimePeriod = timePeriods[i];

    info('Starting a time period data update - %s', currentTimePeriod);

    const dateForTimePeriod = fetchTargetHeatmapDate(currentTimePeriod);

    const targetHeatmapData = await fetchHeatmapDataForDate(dateForTimePeriod, tickers);

    const data = generateHeatmapPrices(todayHeatmapData, targetHeatmapData);

    info(
      'Heatmap prices for target time period: %O, we have heatmap data for %s items',
      util.inspect(data, { maxArrayLength: null }),
      data.length,
    );

    heatmapData[currentTimePeriod] = {
      ...heatmapData[currentTimePeriod],
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
 * Gets the concrete date indicated by time period
 *
 * @param {string} timePeriod The time period passed in from the request
 * @returns {Moment} The date of the price we want to fetch for our tickers
 */
function fetchTargetHeatmapDate(timePeriod) {
  const daysToRemove = SUPPORTED_TIME_PERIODS[timePeriod];
  const date = moment();

  const targetDate = date.subtract(daysToRemove, 'days');

  return targetDate;
}

/**
 * Gets the "todays" date to fetch heatmap data for. This will always be
 * one day behind as there's no guarantee that the price data API's data will
 * have been updated yet
 *
 * @returns {Moment} "Todays" date we want to compare our heatmap data with
 */
function fetchTodayHeatmapDate() {
  return moment().subtract(1, 'days');
}

/**
 * Small method to format date according to the Heatmap spec
 *
 * @param {Moment} date The date to format
 * @returns {string} The date formatted for heatmaps
 */
function formatHeatmapDate(date) {
  return date.format('YYYY-MM-DD');
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
 * @param {Moment} date The date we want to fetch price data for
 * @param {Array.<string>} tickers The tickers we want heatmap data for
 * @returns {object} An object containing all price data for a given date
 */
async function fetchHeatmapDataForDate(date, tickers) {
  const batchReader = new DynamoReadBatch(AWS_CREDENTIALS, DYNAMO_REGION, DYNAMO_TABLE);

  const targetDate = await findNearestDateWithData(batchReader, date, tickers[0]);

  const heatmapDateReadItems = createDynamoReadItems(targetDate, tickers);

  const data = await batchReader.readItems(heatmapDateReadItems);

  return data;
}

/**
 * Creates the read items based on the tickers we want data for
 *
 * @param {Moment} date The date we want to fetch price data for
 * @param {Array.<string>} tickers The tickers we want heatmap data for
 * @returns {object} An object representing read data for the DynamoBatch class
 */
function createDynamoReadItems(date, tickers) {
  const formattedDate = formatHeatmapDate(date);

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
 * information for a price for one stock, we'll find it for all the others.
 *
 * @param {DynamoReadBatch} batchReader Class used to read dynamo data
 * @param {string} date Date used to start the search with
 * @param {string} ticker The tickers used to find data for
 * @throws {MissingDynamoData} When we can't find a date to work with
 * @returns {Moment} A date object to use for our heatmap data
 */
async function findNearestDateWithData(batchReader, date, ticker) {
  for (let i = 0; i < MAX_RETRY_DATES; i += 1) {
    const readItem = createDynamoReadItems(date, [ticker]);
    const data = await batchReader.readItems(readItem);

    const dataValues = Object.values(data);

    if (dataValues.length === 1 && !(dataValues[0] instanceof Error)) {
      return date;
    }

    date.subtract(1, 'days');
  }

  throw new MissingDynamoData(`Could not find any data after retries for ticker: ${ticker}`);
}

export default main;
