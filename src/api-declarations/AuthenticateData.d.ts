/**
 * Response from login api endpoint.
 */
interface AuthenticateData {
  /**
   * Username which was used to log in.
   * @type {string}
   */
  username: string;
  /**
   * Id of logged in user.
   * @type {number}
   */
  userId: number;
  /**
   * Login session key.
   * @type {string}
   */
  key: string;
}
