const SUPPORTED_INDEXES = {
  ftse_100: {
    ticker_url: 'https://www.londonstockexchange.com/indices/ftse-100/constituents/table',
  },
  ftse_250: {
    ticker_url: 'https://www.londonstockexchange.com/indices/ftse-250/constituents/table',
  },
  ftse_350: {
    ticker_url: 'https://www.londonstockexchange.com/indices/ftse-350/constituents/table',
  },
  ftse_all_share: {
    ticker_url: 'https://www.londonstockexchange.com/indices/ftse-all-share/constituents/table',
  },
  ftse_small_cap: {
    ticker_url: 'https://www.londonstockexchange.com/indices/ftse-aim-all-share/constituents/table',
  },
};

export default SUPPORTED_INDEXES;
