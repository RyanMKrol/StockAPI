import MailSender from 'noodle-email';

import { info, error } from './logger';
import INDEXES_CONFIG from './IndexesConfig';
import AWS_CREDENTIALS from '../../../credentials/dynamo.json';
import GMAIL_CREDENTIALS from '../../../credentials/gmail.json';
import ALPHA_VANTAGE_CREDENTIALS from '../../../credentials/alphavantage.json';

const DYNAMO_REGION = 'us-east-2';

const SUPPORTED_ATTRIBUTES = Object.freeze({
  REVENUE: 'Revenue',
  PRE_TAX_PROFIT: 'Pre Tax Profit',
  OPERATING_PROFIT: 'Operating Profit',
});

const API_STORAGE_KEYS = Object.freeze({
  TICKERS: 'tickers',
  FUNDAMENTALS: 'fundamentals',
  HEATMAPS: 'heatmaps',
});

const SUPPORTED_TIME_PERIODS = Object.freeze({
  ONE_MONTH: 30,
  THREE_MONTH: 90,
  SIX_MONTH: 180,
  ONE_YEAR: 360,
  TWO_YEAR: 720,
});

const MAIL_CLIENT = new MailSender(GMAIL_CREDENTIALS);
MAIL_CLIENT.setFrom('"StockAPI" <ryankrol.m@gmail.com>');
MAIL_CLIENT.setTo('ryankrol.m@gmail.com');

export {
  INDEXES_CONFIG,
  info,
  error,
  SUPPORTED_ATTRIBUTES,
  SUPPORTED_TIME_PERIODS,
  API_STORAGE_KEYS,
  MAIL_CLIENT,
  AWS_CREDENTIALS,
  ALPHA_VANTAGE_CREDENTIALS,
  DYNAMO_REGION,
};
