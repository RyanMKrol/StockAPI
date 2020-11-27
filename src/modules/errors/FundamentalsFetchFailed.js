/**
 * @memberof module:errors
 */

/**
 * Used whenever a fetch to get fundamentals data fails
 */
class FundamentalsFetchFailed extends Error {
  /**
   * @param {...any} params Anything you want passing to the Error constructor
   */
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FundamentalsFetchFailed);
    }

    this.Error = 'FundamentalsFetchFailed';
    this.StatusCode = 500;
  }
}

export default FundamentalsFetchFailed;
