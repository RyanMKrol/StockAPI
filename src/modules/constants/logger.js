/* eslint-disable no-console */

// has it's own file due to circular dependency between indexesConfig.js and
// index.js if I define it in index.js. index.js imports from IndexesConfig.js for
// the class, then IndexesConfig.js imports from index.js for the logger
import * as utils from 'noodle-utils';

const info = utils.logger('StockAPI:info');
info.log = console.log.bind(console);

const error = utils.logger('StockAPI:err');

export { info, error };
