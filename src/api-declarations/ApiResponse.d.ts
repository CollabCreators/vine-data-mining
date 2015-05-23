/**
 * Generic Vine API response. This will be returned from any request.
 */
interface ApiResponse<T> {
  /**
   * HTTP response code.
   * @type {number}
   */
  code: number;
  /**
   * Response data (more strict definitons in interfaces below).
   * @type {T}
   */
  data: T;
  /**
   * True if request was successful, false otherwise.
   * @type {boolean}
   */
  success: boolean;
  /**
   * Contains error message if request failed, empty string upon successful request.
   * @type {string}
   */
  error: string;
}
