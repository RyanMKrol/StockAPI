/**
 * Used whenever we make a bad request to an API.
 */
class DownstreamBadRequest extends Error {
  /**
   * @param {...any} params Anything you want passing to the Error constructor
   */
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DownstreamBadRequest);
    }

    this.Error = 'DownstreamBadRequest';
    this.StatusCode = 500;
  }
}

export default DownstreamBadRequest;
