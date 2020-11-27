/**
 * Used whenever the Dynamo table does not have the data we're looking for
 */
class MissingDynamoData extends Error {
  /**
   * @param {...any} params Anything you want passing to the Error constructor
   */
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingDynamoData);
    }

    this.Error = 'MissingDynamoData';
    this.StatusCode = 404;
  }
}

export default MissingDynamoData;
