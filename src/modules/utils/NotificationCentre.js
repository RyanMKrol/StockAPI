/* eslint-disable no-console */

/**
 * NotificationCentre
 *
 * This currently does nothing but will eventually be an abstraction for dealing
 * with every log that the application needs
 */
class NotificationCentre {
  /**
   * constructor
   */
  constructor() {
    this.applicationName = 'stock-api';
  }

  /**
   * Prints info logs
   *
   * @param {string} message message
   */
  info(message) {
    console.log(`${this.applicationName}: ${message}`);
  }

  /**
   * Prints error logs
   *
   * @param {string} message message
   */
  error(message) {
    console.error(`${this.applicationName}: ${message}`);
  }
}

const NOTIFICATION_CENTRE = new NotificationCentre();

export default NOTIFICATION_CENTRE;
