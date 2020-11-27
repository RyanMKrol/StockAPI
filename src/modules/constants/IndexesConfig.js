import { IndexUnsupported } from '../errors';
import { info, error } from './logger';

/**
 * Object to wrap the config associated with our supported indexes
 */
class IndexesConfig {
  /**
   * Constructor
   */
  constructor() {
    this.config = Object.freeze({
      FTSE_100: {
        tickers_loc: 'https://www.londonstockexchange.com/indices/ftse-100/constituents/table',
      },
      FTSE_250: {
        tickers_loc: 'https://www.londonstockexchange.com/indices/ftse-250/constituents/table',
      },
      FTSE_350: {
        tickers_loc: 'https://www.londonstockexchange.com/indices/ftse-350/constituents/table',
      },
      FTSE_ALL_SHARE: {
        tickers_loc:
          'https://www.londonstockexchange.com/indices/ftse-all-share/constituents/table',
        fundamentals_loc:
          'https://www.lse.co.uk/share-prices/indices/ftse-all-share/constituents.html',
      },
    });
  }

  /**
   * Method to fetch the link to fetch the tickers for the given index
   *
   * @param {string} index The index to grab the tickers link for
   * @returns {string} The link to fetch tickers with
   * @throws {IndexUnsupported} If the index param isn't supported
   */
  getTickersLink(index) {
    if (!this.config[index]) {
      error('Could not find tickers link for index: %s, in config: %O', index, this.config);
      throw new IndexUnsupported();
    }

    const tickersLink = this.config[index].tickers_loc;

    info('Returning this tickers link: %s', tickersLink);

    return tickersLink;
  }

  /**
   * Method to fetch the link to fetch the fundamentals for all shares we support.
   This hard codes the ALL_SHARE link as this encapsulates all of the other indexes
   this tool will support for now
   *
   * @returns {string} The link to fetch fundamentals with
   */
  getFundamentalsLink() {
    const fundamentalsLink = this.config.FTSE_ALL_SHARE.fundamentals_loc;

    info('Returning this fundamentals link: %s', fundamentalsLink);

    return fundamentalsLink;
  }
}

// exporting only a single instance of this class
const indexConfig = new IndexesConfig();

export default indexConfig;
