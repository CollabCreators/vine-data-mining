/**
 * Response from /users API.
 * GET https://api.vineapp.com/users/profiles/<userid>
 */
interface UserData {
  /**
   * Username of this user.
   * @type {string}
   */
  username: string;
  /**
   * Number of followers this user has.
   * @type {number}
   */
  followerCount: number;
  /**
   * Is this user verified (0, 1).
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
   * Number of authored posts.
   * @type {number}
   */
  authoredPostCount: number;
  /**
   * Link to user's profile.
   * @type {string}
   */
  shareUrl: string;
  /**
   * Id of this user.
   * @type {number}
   */
  userId: number;
  /**
   * Number of posts this user uploaded.
   * @type {number}
   */
  postCount: number;
  /**
   * Background of user's profile, in form 0xRRGGBB.
   * @type {string}
   */
  profileBackground: string;
  /**
   * Number of liked Vines.
   * @type {number}
   */
  likeCount: number;
  /**
   * Is this user private (0, 1).
   * @type {number}
   */
  private: number;
  /**
   * User's location. Might not be accurate since they have to enter it themselves.
   * @type {string}
   */
  location: string;
  /**
   * Number of users this user is following.
   * @type {number}
   */
  followingCount: number;
  /**
   * Unknown. Could be number of explicit posts or flag (0, 1) if this is an explicit post.
   * @type {number}
   */
  explicitContent: number;
  /**
   * Description of user's profile.
   * @type {string}
   */
  description: string;
}
