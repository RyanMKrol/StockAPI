import curl from 'curl';
import cheerio from 'cheerio';
import async from 'async';
import util from 'util';
import * as noodleUtils from 'noodle-utils';
import { NOTIFICATION_CENTRE } from '../utils';
import { fetchFundamentalsUrlForIndex } from './indexes';

const SUPPORTED_ATTRIBUTES = Object.freeze({
  REVENUE: 'Revenue',
  PRE_TAX_PROFIT: 'Pre Tax Profit',
  OPERATING_PROFIT: 'Operating Profit',
});

const WAIT_BETWEEN_FETCHES = 3000;
const SIMULTANEOUS_FUNDAMENTALS_FETCHES = 5;

const SHARE_NAME_URL_PARAM = 'shareprice';

const HTML_REVENUE = 'Revenue';
const HTML_TURNOVER = 'Turnover';
const HTML_PRE_TAX_PROFIT = 'Pre Tax Profit';
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

    NOTIFICATION_CENTRE.info(`Parsing ticker from URL, URL: ${link}, ticker: ${ticker}`);

    return new Promise((resolve, reject) => {
      curl.get(link, (err, response, body) => {
        try {
          const $ = cheerio.load(body);

          resolve({
            ticker,
            dataSourceLink: link,
            followUpLink: `https://www.google.com/finance/quote/${ticker}:LON?window=1Y`,
            [SUPPORTED_ATTRIBUTES.REVENUE]: attributeProcessor($, [HTML_REVENUE, HTML_TURNOVER]),
            [SUPPORTED_ATTRIBUTES.PRE_TAX_PROFIT]: attributeProcessor($, [HTML_PRE_TAX_PROFIT]),
            [SUPPORTED_ATTRIBUTES.OPERATING_PROFIT]: attributeProcessor($, [HTML_OPERATING_PROFIT]),
          });
        } catch (error) {
          reject(new Error('Failed to fetch fundamentals', error));
        }
      });
    });
  });
}

/**
 * Processor for extracting attributes from fundamentals
 *
 * @param {CheerioParseResult} $ The result of parsing the initial page body with Cheerio
 * @param {Array<string>} rowTitles The title corresponding to the attribute we want to fetch
 * @returns {Array.<number>} The numbers corresponding to the attribute we want
 */
function attributeProcessor($, rowTitles) {
  const fundamentalsTableRows = $('.sp-fundamentals__table tr').filter((i, elem) => rowTitles.includes(
    $(elem)
      .children('td')
      .first()
      .text(),
  ));

  const attributeData = $(fundamentalsTableRows)
    .children('td')
    .map((i, elem) => (i === 0 ? undefined : $(elem).text()))
    .get()
    .map((x) => {
      NOTIFICATION_CENTRE.info(`Value at the start of parsing: ${x}`);

      // checks if the number is negative to modify the final result
      const negativeMultiplyer = x.includes('(') ? -1 : 1;

      // removes all string data to be able to parse number later
      const rawNumber = x.replace(/[,|(|)]/g, '');

      const parsedNumber = parseInt(rawNumber, 10) * negativeMultiplyer;

      NOTIFICATION_CENTRE.info(`Value at the end of parsing: ${parsedNumber}`);

      return parsedNumber;
    });

  // reversed because the data on site starts from most recent
  return attributeData.reverse();
}

/**
 * Method to fetch the fundamentals links for each stock in the FTSE_ALL_SHARE
 *
 * @param {string} constituentsUrl The URL with links to every constituent in the index
 * @returns {Array.<string>} Array of links correlating to the fundamentals page for each stock
 */
async function fetchFundamentalsLinks(constituentsUrl) {
  return new Promise((resolve, reject) => {
    curl.get(constituentsUrl, (err, response, body) => {
      try {
        const $ = cheerio.load(body);

        const baseLinks = $('.sp-constituents tr > td:nth-child(1) a:nth-child(2)')
          .map((i, elem) => $(elem).attr('href'))
          .get();

        NOTIFICATION_CENTRE.info(
          `These are the base links: ${util.inspect(baseLinks, { maxArrayLength: null })}`,
        );

        const links = baseLinks.map((x) => x.replace('SharePrice.asp', 'share-fundamentals.asp'));

        NOTIFICATION_CENTRE.info(
          `These are the final links: ${util.inspect(links, { maxArrayLength: null })}`,
        );

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
 * @param {string} index index
 * @returns {Array.<module:app.Fundamentals>} The fundamentals for every stock in FTSE_ALL_SHARE
 */
async function fetchFundamentalsData(index) {
  const constituentsUrl = fetchFundamentalsUrlForIndex(index);

  const fundamentalsLinks = await fetchFundamentalsLinks(constituentsUrl);

  const fundamentals = await fetchFundamentals(fundamentalsLinks);

  NOTIFICATION_CENTRE.info(
    `These are the fundamentals: ${util.inspect(fundamentals, { maxArrayLength: null })}`,
  );

  return fundamentals;
}

export default fetchFundamentalsData;
