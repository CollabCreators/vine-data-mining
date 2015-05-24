/**
 * Data collected from user's profile.
 */
interface UserProfileData {
  /**
   * Type of data record.
   * @type {string}
   */
  type: string;
  /**
   * User's username.
   * @type {string}
   */
  username: string;
  /**
   * User's user id.
   * @type {string}
   */
  userId: string;
  /**
   * Number of user's followers.
   * @type {number}
   */
  followerCount: number;
  /**
   * Sum of all posted vines loops.
   * @type {number}
   */
  loopCount: number;
  /**
   * Number of posts.
   * @type {number}
   */
  postCount: number;
  /**
   * Location user has entered. It's probably not very reliable.
   * @type {string}
   */
  location: string;
  /**
   * Number of users this user is following.
   * @type {number}
   */
  followingCount: number;
}

/**
 * Data collected from a vine upload.
 */
interface VineData {
  /**
   * Type of data record.
   * @type {string}
   */
  type: string;
  /**
   * User id of vine author.
   * @type {number}
   */
  authorId: string;
  /**
   * Number of times this vine was looped.
   * @type {number}
   */
  loopCount: number;
  /**
   * Number of comments for this vine.
   * @type {number}
   */
  commentsCount: number;
  /**
   * Tags for this vine. (most likely an empty array)
   * @type {Array<string>}
   */
  tags: Array<string>;
  /**
   * Id of this post.
   * @type {string}
   */
  postId: string;
  /**
   * Number of times this vine was reposted.
   * @type {number}
   */
  respostsCount: number;
  /**
   * Number of times this vine was liked.
   * @type {number}
   */
  likesCount: number;
  /**
   * Date when this vine was uploaded.
   * @type {Date}
   */
  created: Date;
  /**
   * An array of mentioned userids.
   * @type {Array<string>}
   */
  mentions: Array<string>;
}
