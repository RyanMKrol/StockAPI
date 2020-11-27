/**
 * @memberof module:errors
 */

/**
 * Used whenever a request provides an unsupported index
 */
class IndexUnsupported extends Error {
  /**
   * @param {...any} params Anything you want passing to the Error constructor
   */
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IndexUnsupported);
    }

    this.Error = 'IndexUnsupported';
    this.StatusCode = 400;
  }
}

export default IndexUnsupported;
