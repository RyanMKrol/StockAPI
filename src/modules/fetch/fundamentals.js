import curl from 'curl';
import cheerio from 'cheerio';
import async from 'async';
import util from 'util';
import * as noodleUtils from 'noodle-utils';

import { INDEXES_CONFIG, SUPPORTED_ATTRIBUTES, info } from '../constants';
import { FundamentalsFetchFailed } from '../errors';

const WAIT_BETWEEN_FETCHES = 3000;
const SIMULTANEOUS_FUNDAMENTALS_FETCHES = 5;

const SHARE_NAME_URL_PARAM = 'shareprice';

const HTML_REVENUE = 'Revenue';
const HTML_PRE_TAX_PROFIT = 'Pre tax Profit';
const HTML_OPERATING_PROFIT = 'Operating Profit / Loss';

/**
 * @typedef CheerioParseResult
 * @see https://www.npmjs.com/package/cheerio
 */

/**
 * Method to fetch relevant fundamentals data for given stock links
 *
 * @param {Array.<string>} links Links for the stocks we want data for
 * @returns {Array.<module:app.Fundamentals>} The fundamentals for every stock in the index
 */
async function fetchFundamentals(links) {
  return async.mapLimit(links, SIMULTANEOUS_FUNDAMENTALS_FETCHES, async (link) => {
    await noodleUtils.sleep(WAIT_BETWEEN_FETCHES);

    const ticker = new URL(link).searchParams.get(SHARE_NAME_URL_PARAM);

    info('Parsing ticker from URL, URL: %s, ticker: ', link, ticker);

    return new Promise((resolve, reject) => {
      curl.get(link, (err, response, body) => {
        try {
          const $ = cheerio.load(body);

          resolve({
            ticker,
            dataSourceLink: link,
            followUpLink: `https://www.google.com/finance/quote/${ticker}:LON?window=1Y`,
            [SUPPORTED_ATTRIBUTES.REVENUE]: attributeProcessor($, HTML_REVENUE),
            [SUPPORTED_ATTRIBUTES.PRE_TAX_PROFIT]: attributeProcessor($, HTML_PRE_TAX_PROFIT),
            [SUPPORTED_ATTRIBUTES.OPERATING_PROFIT]: attributeProcessor($, HTML_OPERATING_PROFIT),
          });
        } catch (error) {
          reject(new FundamentalsFetchFailed(error));
        }
      });
    });
  });
}

/**
 * Processor for extracting attributes from fundamentals
 *
 * @param {CheerioParseResult} $ The result of parsing the initial page body with Cheerio
 * @param {string} rowTitle The title corresponding to the attribute we want to fetch
 * @returns {Array.<number>} The numbers corresponding to the attribute we want
 */
function attributeProcessor($, rowTitle) {
  const fundamentalsTableRows = $('.sp-fundamentals__table tr').filter(
    (i, elem) => $(elem)
      .children('td')
      .first()
      .text() === rowTitle,
  );

  const attributeData = $(fundamentalsTableRows)
    .children('td')
    .map((i, elem) => (i === 0 ? undefined : $(elem).text()))
    .get()
    .map((x) => {
      info('Value at the start of parsing: %s', x);

      // checks if the number is negative to modify the final result
      const negativeMultiplyer = x.includes('(') ? -1 : 1;

      // removes all string data to be able to parse number later
      const rawNumber = x.replace(/[,|(|)]/g, '');

      const parsedNumber = parseInt(rawNumber, 10) * negativeMultiplyer;

      info('Value at the end of parsing: %s', parsedNumber);

      return parsedNumber;
    });

  // reversed because the data on site starts from most recent
  return attributeData.reverse();
}

/**
 * Method to fetch the fundamentals links for each stock in the FTSE_ALL_SHARE
 *
 * @returns {Array.<string>} Array of links correlating to the fundamentals page for each stock
 */
async function fetchFundamentalsLinks() {
  const constituentsUrl = INDEXES_CONFIG.getFundamentalsLink();

  return new Promise((resolve, reject) => {
    curl.get(constituentsUrl, (err, response, body) => {
      try {
        const $ = cheerio.load(body);

        const baseLinks = $('.sp-constituents tr > td:nth-child(1) a:nth-child(2)')
          .map((i, elem) => $(elem).attr('href'))
          .get();

        info('These are the base links: %O', util.inspect(baseLinks, { maxArrayLength: null }));

        const links = baseLinks.map((x) => x.replace('SharePrice.asp', 'share-fundamentals.asp'));

        info('These are the final links: %O', util.inspect(links, { maxArrayLength: null }));

        resolve(links);
      } catch (error) {
        reject(new Error('Failed to fetch the constituents'));
      }
    });
  });
}

/**
 * The ingress for fetching fundamentals data
 *
 * @returns {Array.<module:app.Fundamentals>} The fundamentals for every stock in FTSE_ALL_SHARE
 */
async function fetchFundamentalsData() {
  const fundamentalsLinks = await fetchFundamentalsLinks();
  const fundamentals = await fetchFundamentals(fundamentalsLinks);

  info('These are the fundamentals: %O', util.inspect(fundamentals, { maxArrayLength: null }));

  return fundamentals;
}

export default fetchFundamentalsData;
