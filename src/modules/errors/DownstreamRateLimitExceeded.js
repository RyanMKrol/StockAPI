/**
 * Used when we detect we've exceeded the rate limit for one of our downstream calls
 */
class DownstreamRateLimitExceeded extends Error {
  /**
   * @param {...any} params Anything you want passing to the Error constructor
   */
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DownstreamRateLimitExceeded);
    }

    this.Error = 'DownstreamRateLimitExceeded';
    this.StatusCode = 500;
  }
}

export default DownstreamRateLimitExceeded;
