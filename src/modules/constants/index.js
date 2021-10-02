import MailSender from 'noodle-email';

import ALPHA_VANTAGE_CREDENTIALS from '../../../credentials/alphavantage.json';
import AWS_CREDENTIALS from '../../../credentials/dynamo.json';
import GMAIL_CREDENTIALS from '../../../credentials/gmail.json';

const MAIL_CLIENT = new MailSender(GMAIL_CREDENTIALS);
MAIL_CLIENT.setFrom('"StockAPI" <ryankrol.m@gmail.com>');
MAIL_CLIENT.setTo('ryankrol.m@gmail.com');

export {
  ALPHA_VANTAGE_CREDENTIALS, AWS_CREDENTIALS, GMAIL_CREDENTIALS, MAIL_CLIENT,
};
