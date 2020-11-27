import { info, error } from './logger';
import INDEXES_CONFIG from './IndexesConfig';

const SUPPORTED_ATTRIBUTES = {
  REVENUE: 'Revenue',
  PRE_TAX_PROFIT: 'Pre Tax Profit',
  OPERATING_PROFIT: 'Operating Profit',
};

export {
  INDEXES_CONFIG, info, error, SUPPORTED_ATTRIBUTES,
};
