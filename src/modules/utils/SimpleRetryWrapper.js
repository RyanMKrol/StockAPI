import util from 'util';
import { sleep } from 'noodle-utils';
import NOTIFICATION_CENTRE from './NotificationCentre';

/**
 * A class that will retry a method using a simple wait between retries
 */
class SimpleRetryWrapper {
  /**
   * Constructor
   *
   * @param {Function} method The method to retry
   * @param {object} options The options to apply to the retry
   */
  constructor(method, options) {
    if (!method) {
      throw new Error('Invalid arguments, must provide method to SimpleRetryWrapper');
    }

    if (!options.retryPolicy) {
      throw new Error(
        'Invalid arguments, must provide retryPolicy in options to SimpleRetryWrapper',
      );
    }

    if (!options.waitTime) {
      throw new Error('Invalid arguments, must provide waitTime in options to SimpleRetryWrapper');
    }

    this.method = method;
    this.options = options;
    this.attempts = 0;
  }

  /**
   * Method to start the method being retried
   *
   * @returns {any} Whatever data the retried method likes
   */
  async start() {
    const retryPolicy = this.retryPolicy();
    const numRetries = this.numRetries();
    const waitTime = this.waitTime();

    let data;

    try {
      data = await this.method();
    } catch (e) {
      data = e;
    }

    this.attempts += 1;

    if (await retryPolicy(data)) {
      NOTIFICATION_CENTRE.info('Data fits retry policy, attempting to retry');

      if (this.attempts <= numRetries) {
        NOTIFICATION_CENTRE.info('We still have retries remaining, starting wait...');

        await sleep(waitTime);

        NOTIFICATION_CENTRE.info('Retrying...');

        return this.start();
      }

      NOTIFICATION_CENTRE.error('We have no retries remaining, emitting an error');

      data = new Error('Could not retry');
    }

    NOTIFICATION_CENTRE.info(
      'Returning real data: %O',
      util.inspect(data, { maxArrayLength: null, depth: 30 }),
    );

    return data;
  }

  /**
   * Returns the number of retries from the initial options
   *
   * @returns {number} The number of retries
   */
  numRetries() {
    return this.options.numRetries || 3;
  }

  /**
   * Fetches the policy to apply to the data we receive from the method being retried
   *
   * @returns {Function} Method to decide whether to retry or not
   */
  retryPolicy() {
    return this.options.retryPolicy;
  }

  /**
   * Fetches the time to wait between retries
   *
   * @returns {number} The time to wait in ms
   */
  waitTime() {
    return this.options.waitTime;
  }
}

export default SimpleRetryWrapper;
