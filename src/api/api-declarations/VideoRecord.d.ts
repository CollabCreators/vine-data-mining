/// <reference path="./PaginatedResponse.d.ts"/>

/**
 * A record in response from timelines/users/<userid>
 * A record in response from timelines/posts/s/<postid>
 */
interface VideoRecord {
  /**
   * Was this video liked (always 0 if not logged in).
   * @type {number}
   */
  liked: number;
  /**
   * Direct video url.
   * @type {string}
   */
  videoDashUrl: string;
  /**
   * Author userId.
   * @type {number}
   */
  userId: number;
  /**
   * Is this video private (0, 1).
   * @type {number}
   */
  private: number;
  /**
   * Url to webM video.
   * @type {string}
   */
  videoWebmUrl?: string;
  /**
   * Data about loops.
   * @type {LoopRecord}
   */
  loops: LoopRecord;
  /**
   * Url to thumbnail image
   * @type {string}
   */
  thumbnailUrl: string;
  /**
   * Is this explicit content (0, 1).
   * @type {number}
   */
  explicitContent: number;
  /**
   * If Vine is repost, this will contain data about reposter.
   * @type {Object}
   */
  repost?: Object;
  /**
  * Is this video blocked (0, 1).
  * @type {number}
   */
  blocked: number;
  /**
  * Is author verified (0, 1).
  * @type {number}
   */
  verified: number;
  /**
   * Url to author's avatar.
   * @type {string}
   */
  avatarUrl: string;
  /**
   * Record of comments.
   * @type {PaginatedResponse}
   */
  comments: PaginatedResponse<any>;
  /**
   * Entities of this video, i.e. mentions.
   * @type {Array<VideoEntityRecord>}
   */
  entities: Array<VideoEntityRecord>;
  /**
   * Url where user profile is available, aliases (vine.co/<vanityUrls>).
   * @type {Array<string>}
   */
  vanityUrls: Array<string>;
  /**
   * Username of author.
   * @type {string}
   */
  username: string;
  /**
   * Description of this vine.
   *
   * @type {string}
   */
  description: string;
  /**
   * An array of tags.
   * As tested it's always empty, possibly deprecated.
   * @type {any}
   */
  tags: Array<any>;
  /**
   * Permanenet url to this video.
   * @type {string}
   */
  permalinkUrl: string;
  /**
   * Has been this video promoted (0, 1).
   * @type {number}
   */
  promoted: number;
  /**
   * Id of this post.
   * @type {number}
   */
  postId: number;
  /**
   * Hex code of background color in form 0xRRGGBB.
   * @type {string}
   */
  profileBackground: string;
  /**
   * Vine url to this video.
   * @type {string}
   */
  videoUrl: string;
  /**
   * Date string. Use `new Date` to turn it into date format.
   * @type {string}
   */
  created: string;
  /**
   * Url to share this video with others.
   * @type {string}
   */
  shareUrl: string;
  /**
   * Data about video reposts.
   * @type {PaginatedResponse}
   */
  reposts: PaginatedResponse<any>;
  /**
   * Data about video likes.
   * @type {PaginatedResponse}
   */
  likes: PaginatedResponse<any>;

  // Possible values if parsing API data. Because TypeScript throws errors otherwise.
  loopCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  likesCount?: number;
  isRepost?: boolean;
  vineId?: string;
  mentions?: Array<string>;
}

/**
 * A record storing information about loops.
 */
interface LoopRecord {
  /**
   * Count of loops.
   * @type {number}
   */
  count: number;
  /**
   * Unknown.
   * @type {number}
   */
  velocity: number;
  /**
   * Unknown.
   * @type {number}
   */
  onFire: number;
}

/**
 * A record in array of entities on a video.
 */
interface VideoEntityRecord {
  /**
   * Vine link to entity.
   * @type {string}
   */
  link: string;
  /**
   * Unknown.
   * @type {Array<number>}
   */
  range: Array<number>;
  /**
   * Type of entity.
   * @type {string}
   */
  type: string;
  /**
   * Id of entity.
   * @type {number}
   */
  id: number;
  /**
   * Title/name of entity.
   * @type {string}
   */
  title: string;
  /**
   * Vanity urls of entity.
   * @type {Array<string>}
   */
  vanityUrls: Array<string>;
}
