/// <reference path="./PaginatedResponse.d.ts"/>

/**
 * A PaginatedResponse from user search.
 * 	records: Array<UserSearchRecord>
 * GET https://api.vineapp.com/users/search/<username>?page=x&size=y
 * Defaults:
 * 	page: x = 1
 * 	size: y = 20
 */

/**
 * A single record in an arraw of response from /users/search/<UserName> request.
 */
interface UserSearchRecord {
  /**
   * Username of this user.
   * @type {string}
   */
  username: string;
  /**
   * Is this user verrified (0, 1).
   * @type {number}
   */
  verified: number;
  /**
   * Url where user profile is available, aliases (vine.co/<vanityUrls>).
   * @type {Array<string>}
   */
  vanityUrls: Array<string>;
  /**
   * Sum of all vine loops.
   * @type {number}
   */
  loopCount: number;
  /**
   * Url to user's avatar image.
   * @type {string}
   */
  avatarUrl: string;
  /**
   * Id of this user.
   * @type {number}
   */
  userId: number;
  /**
   * Hex code of background color in form 0xRRGGBB.
   * @type {string}
   */
  profileBackground?: string;
  /**
   * Record storing if user is private.
   * @type {UserPrivateProperty}
   */
  user: UserPrivateProperty;
  /**
   * User's location. Might not be accurate since they have to enter it themselves.
   * @type {string}
   */
  location: string;
}

/**
 * Record storing if user is private.
 */
interface UserPrivateProperty {
  /**
   * Is user private.
   * @type {boolean}
   */
  private: boolean;
}
