import cheerio from 'cheerio';
import curl from 'curl';
import arrayRange from 'array-range';

import { tickersUrlForIndex } from './indexes';

/**
 * Fetches the number of pages to get data for
 *
 * @param {string} url The url to fetch the tickers
 * @returns {Promise.<number>} The number of pages for the index
 */
function getNumberOfPages(url) {
  return new Promise((resolve, reject) => {
    curl.get(url, (err, response, body) => {
      try {
        const $ = cheerio.load(body);

        const pagesUrl = $('.page-last')
          .first()
          .attr('href');

        const searchParams = pagesUrl.split('?')[1];
        const numPages = new URLSearchParams(searchParams).get('page');

        const intNumPages = parseInt(numPages, 10);

        resolve(intNumPages);
      } catch (e) {
        reject(new Error(`Could not grab number of pages needed from page: ${url}, error: ${e}`));
      }
    });
  });
}

/**
 * Pulls all of the tickers from an index's tickers page. Example URL:
 * https://www.londonstockexchange.com/indices/ftse-aim-all-share/constituents/table
 *
 * @param {string} url The URL to start pulling tickers from
 * @param {number} numPages The number of pages to pull tickers from
 * @returns {Promise.<Array.<string>>} A promise that will resolve to the tickers in the given index
 */
async function getRawTickersForAllPages(url, numPages) {
  const tickerTasks = arrayRange(1, numPages + 1).map(
    (pageNumber) => new Promise((resolve, reject) => {
      const fetchUrl = `${url}?page=${pageNumber}`;

      // fetch raw page data
      curl.get(fetchUrl, (err, response, body) => {
        // attempt to parse tickers from page
        try {
          const $ = cheerio.load(body);
          const tickers = $('tbody tr')
            .map((i, elem) => $(elem)
              .find('a')
              .eq(0)
              .text())
            .get();

          resolve(tickers);
        } catch (e) {
          reject(
            new Error(`Could not grab number of pages needed from page: ${url}, error: ${e}`),
          );
        }
      });
    }),
  );

  // wait for all tasks to finish
  return Promise.all(tickerTasks);
}

/**
 * Fetch the tickers for the current index
 *
 * @param {string} index The current stock index
 * @returns {Array.<string>} List of tickers for the current index
 */
async function fetchTickers(index) {
  const url = tickersUrlForIndex(index);

  const numPages = await getNumberOfPages(url);

  const tickers = (await getRawTickersForAllPages(url, numPages)).flat().sort();

  return tickers;
}

export default fetchTickers;
