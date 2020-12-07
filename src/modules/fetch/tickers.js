import cheerio from 'cheerio';
import curl from 'curl';
import arrayRange from 'array-range';
import util from 'util';

import { INDEXES_CONFIG, info, error } from '../constants';

const PAGINATION_IDENTIFIER = '.page-last';

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

        const pagesUrl = $(PAGINATION_IDENTIFIER)
          .first()
          .attr('href');

        const searchParams = pagesUrl.split('?')[1];
        const numPages = new URLSearchParams(searchParams).get('page');

        const intNumPages = parseInt(numPages, 10);

        resolve(intNumPages);
      } catch (e) {
        error('The response from curl was: %O', response);
        reject(new Error(`Could not grab number of pages needed from page: ${url}, error: ${e}`));
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

  if (!url) {
    throw new Error(`Could not find where to grab stock data for ${stockIndex}`);
  }

  const numPages = await getNumberOfPages(url);

  info('The number of pages to search for data: %s', numPages);

  const tickerTasks = arrayRange(1, numPages + 1).map(
    (pageNumber) => new Promise((resolve, reject) => {
      const fetchUrl = `${url}?page=${pageNumber}`;

      info('Fetching tickers from URL: %s', fetchUrl);

      // fetch info from page
      curl.get(fetchUrl, (err, response, body) => {
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
 * Method to fetch the tickers for the current index
 *
 * @param {string} stockIndex The current stock index
 * @returns {Array.<string>} List of tickers for the current index
 */
async function fetchTickers(stockIndex) {
  info('Fetching tickers for this index: %s', stockIndex);

  const tickers = (await getRawTickersForAllPages(stockIndex)).flat().sort();

  info('Found these tickers: %O', util.inspect(tickers, { maxArrayLength: null }));

  return tickers;
}

export default fetchTickers;
