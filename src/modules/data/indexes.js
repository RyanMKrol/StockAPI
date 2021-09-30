const INDEXES = {
  FTSE_100: 'FTSE_100',
  FTSE_250: 'FTSE_250',
  FTSE_350: 'FTSE_350',
  FTSE_ALL_SHARE: 'FTSE_ALL_SHARE',
  FTSE_AIM_ALL_SHARE: 'FTSE_AIM_ALL_SHARE',
};
/**
 * Fetches the indexes supported by the API
 *
 * @returns {Array<string>} An array of supported indexes
 */
function fetchSupportedIndexes() {
  return Object.values(INDEXES);
}

/**
 * Fetches the URL to find ticker data for a given index
 *
 * @param {string} index The index to find ticker data for
 * @returns {string} The URL to fetch index tickers
 */
function fetchTickersUrlForIndex(index) {
  switch (index) {
    case INDEXES.FTSE_100:
      return 'https://www.londonstockexchange.com/indices/ftse-100/constituents/table';
    case INDEXES.FTSE_250:
      return 'https://www.londonstockexchange.com/indices/ftse-250/constituents/table';
    case INDEXES.FTSE_350:
      return 'https://www.londonstockexchange.com/indices/ftse-350/constituents/table';
    case INDEXES.FTSE_ALL_SHARE:
      return 'https://www.londonstockexchange.com/indices/ftse-all-share/constituents/table';
    case INDEXES.FTSE_AIM_ALL_SHARE:
      return 'https://www.londonstockexchange.com/indices/ftse-aim-all-share/constituents/table';
    default:
      throw new Error(`Could not get URL for given index: ${index}`);
  }
}

/**
 * Fetches the URL to find fundamentals data for a given index
 *
 * @param {string} index The index to find fundamentals data for
 * @returns {string} The URL to fetch index fundamentals
 */
function fetchFundamentalsUrlForIndex(index) {
  switch (index) {
    case INDEXES.FTSE_100:
      return 'https://www.lse.co.uk/share-prices/indices/ftse-100/constituents.html';
    case INDEXES.FTSE_250:
      return 'https://www.lse.co.uk/share-prices/indices/ftse-250/constituents.html';
    case INDEXES.FTSE_350:
      return 'https://www.lse.co.uk/share-prices/indices/ftse-350/constituents.html';
    case INDEXES.FTSE_ALL_SHARE:
      return 'https://www.lse.co.uk/share-prices/indices/ftse-all-share/constituents.html';
    case INDEXES.FTSE_AIM_ALL_SHARE:
      return 'https://www.lse.co.uk/share-prices/indices/ftse-aim-all-share/constituents.html';
    default:
      throw new Error(`Could not get URL for given index: ${index}`);
  }
}

export { fetchSupportedIndexes, fetchTickersUrlForIndex, fetchFundamentalsUrlForIndex };
