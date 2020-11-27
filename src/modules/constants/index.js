import { info, error } from './logger';
import INDEXES_CONFIG from './IndexesConfig';
import DYNAMO_CREDENTIALS from '../../../credentials/dynamo.json';
import GMAIL_CREDENTIALS from '../../../credentials/gmail.json';

const DYNAMO_REGION = 'us-east-2';

const SUPPORTED_ATTRIBUTES = {
  REVENUE: 'Revenue',
  PRE_TAX_PROFIT: 'Pre Tax Profit',
  OPERATING_PROFIT: 'Operating Profit',
};

const API_STORAGE_KEYS = Object.freeze({
  TICKERS: 'tickers',
  FUNDAMENTALS: 'fundamentals',
  HEATMAPS: 'heatmaps',
});

export {
  INDEXES_CONFIG,
  info,
  error,
  SUPPORTED_ATTRIBUTES,
  API_STORAGE_KEYS,
  GMAIL_CREDENTIALS,
  DYNAMO_CREDENTIALS,
  DYNAMO_REGION,
};
