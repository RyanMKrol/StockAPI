import cheerio from 'cheerio';
import curl from 'curl';
import arrayRange from 'array-range';

import INDEXES_CONFIG from '../constants';

const PAGINATION_IDENTIFIER = '.page-last';

/**
 * Fetches the number of pages to get data for
 *
 * @param {string} stockIndex The current stock index we want the pages for
 * @returns {Promise.<number>} The number of pages for the index
 */
function getNumberOfPages(stockIndex) {
  const url = INDEXES_CONFIG.getTickersLink(stockIndex);

  if (!url) {
    throw new Error(`Could not find where to grab stock data for ${stockIndex}`);
  }

  return new Promise((resolve, reject) => {
    curl.get(url, (err, response, body) => {
      try {
        const $ = cheerio.load(body);

        const pagesUrl = $(PAGINATION_IDENTIFIER)
          .first()
          .attr('href');

        const searchParams = pagesUrl.split('?')[1];
        const numPages = new URLSearchParams(searchParams).get('page');

        const intNumPages = parseInt(numPages, 10);

        resolve(intNumPages);
      } catch (error) {
        reject(
          new Error(`Could not grab number of pages needed from page: ${url}, error: ${error}`),
        );
      }
    });
  });
}

/**
 * Fetches the raw data around tickers for a given index
 *
 * @param {string} stockIndex The current index
 * @returns {Promise.<Array.<string>>} A promise that will resolve to the tickers in the given index
 */
async function getRawTickersForAllPages(stockIndex) {
  const url = INDEXES_CONFIG.getTickersLink(stockIndex);

  const numPages = await getNumberOfPages(stockIndex);

  if (!url) {
    throw new Error(`Could not find where to grab stock data for ${stockIndex}`);
  }

  const tickerTasks = arrayRange(1, numPages + 1).map(
    (pageNumber) => new Promise((resolve, reject) => {
      // fetch info from page
      curl.get(`${url}?page=${pageNumber}`, (err, response, body) => {
        // attempt to parse tickers
        try {
          const $ = cheerio.load(body);
          const tickers = $('tbody tr')
            .map((i, elem) => $(elem)
              .find('a')
              .eq(0)
              .text())
            .get();

          resolve(tickers);
        } catch (error) {
          reject(
            new Error(`Could not grab number of pages needed from page: ${url}, error: ${error}`),
          );
        }
      });
    }),
  );

  // wait for all tasks to finish
  return Promise.all(tickerTasks);
}

/**
 * Method to fetch the tickers for the current index
 *
 * @param {string} stockIndex The current stock index
 * @returns {Array.<string>} List of tickers for the current index
 */
async function fetchTickers(stockIndex) {
  const baseTickers = await getRawTickersForAllPages(stockIndex);

  // modify tickers to expected format
  const tickers = baseTickers
    .flat()
    .map((ticker) => (ticker.endsWith('.') ? `${ticker}L` : `${ticker}.L`));

  return tickers;
}

export default fetchTickers;
