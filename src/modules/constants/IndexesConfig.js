import IndexUnsupported from '../errors';

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
      },
      FTSE_SMALL_CAP: {
        tickers_loc:
          'https://www.londonstockexchange.com/indices/ftse-aim-all-share/constituents/table',
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
      throw new IndexUnsupported();
    }

    return this.config[index].tickers_loc;
  }
}

// exporting only a single instance of this class
const indexConfig = new IndexesConfig();

export default indexConfig;
