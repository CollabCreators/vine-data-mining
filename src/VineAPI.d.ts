interface ApiResponse {
    /**
     * HTTP response code.
     * @type {number}
     */
    code: number;
    /**
     * Response data (more strict definitons in interfaces below).
     * @type {any}
     */
    data: any;
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

interface AuthenticateData {
    username: string;
    userId: number;
    key: string;
}

interface UserData {
    username: string;
    following: number;
    followerCount: number;
    verified: number;
    description: string;
    avatarUrl: string;
    twitterId: number;
    userId: number;
    twitterConnected: number;
    likeCount: number;
    facebookConnected: number;
    postCount: number;
    phoneNumber: string;
    location: string;
    followingCount: number;
    email: string;
}

interface UserProfileResponse {
    code: string;
    data: UserData;
    success: boolean;
    error: string;
}

interface UserRecord {
    username: string;
    verified: number;
    vanityUrls: Array<any>;
    avatarUrl: string;
    userId: number;
    profileBackground: string;
    user: any;
    location: string;
}

// GET https://api.vineapp.com/users/search/<username>
interface UserSearchData {
    /**
     * Number of found users.
     * @type {number}
     */
    count: number;
    /**
     * An array of user records, size matches `size` attribute (url param).
     * @type {Array<UserRecord>}
     */
    records: Array<UserRecord>;
    /**
     * * The `page` url param for previous page (null if this is first page).
     * @type {number}
     */
    previousPage: number;
    anchor: number;
    /**
     * The `page` url param for next page (null if this is last page).
     * @type {number}
     */
    nextPage: number;
    /**
     * Size of search response, a number 1 - 60.
     * @type {number}
     */
    size: number;
}

// GET https://api.vineapp.com/users/profiles/<userid>
interface UserProfileData {
    username: string;
    following: number
    followerCount: number;
    verified: number
    description: string;
    avatarUrl: string;
    twitterId: number
    userId: number
    twitterConnected: number;
    likeCount: number;
    facebookConnected: number;
    postCount: number;
    phoneNumber: string;
    location: string;
    followingCount: number;
    email: string;
}

// GET https://api.vineapp.com/timelines/users/<userid>
// GET https://api.vineapp.com/timelines/posts/<postid>
interface UserTimelineData {
    count: number;
    records: Array<VideoRecord>;
    nextPage: number;
    previousPage: number;
    size: number;
}

interface LoopRecord {
    loops: number;
    velocity: number;
    onFire: number;
}

interface CommentsRecord {
    count: number;
    anchorStr: string;
    records: Array<any>;
    previousPage: number;
    backAnchor: string;
    anchor: number;
    nextPage: number;
    size: number;
}

interface VideoEntityRecord {
    link: string;
    range: Array<number>;
    type: string;
    id: number;
    title: string;
    vanityUrls: Array<string>;
}

interface RepostsRecord {
    /**
     * Number of reposts.
     * @type {number}
     */
    count: number;
    anchorStr: string;
    /**
     * Array of records. Always empty, possibly deprecated.
     * @type {Array<any>}
     */
    records: Array<any>;
    /**
    * The `page` url param for prevous page (null if this is first page).
     * @type {number}
     */
    previousPage: number;
    backAnchor: string;
    anchor: number;
    /**
    * The `page` url param for next page (null if this is last page).
     * @type {number}
     */
    nextPage: number;
    /**
     * Size of search response, a number 1 - 60.
     * @type {number}
     */
    size: number;
}

interface LikeRecord {
    username: string;
    verified: number;
    vanityUrls: Array<string>;
    created: string;
    userId: number;
    user: any;
    likeId: number;
}


interface LikesRecord {
    count: number
    anchorStr: string;
    records: Array<LikeRecord>;
    previousPage: number;
    backAnchor: string;
    anchor: number;
    nextPage: number;
    size: number;
}

interface VideoRecord {
    liked: number;
    videoDashUrl: string;
    foursquareVenueId: any;
    userId: number;
    private: number;
    videoWebmUrl: string;
    loops: LoopRecord;
    thumbnailUrl: string;
    explicitContent: number;
    blocked: number;
    verified: number;
    avatarUrl: string;
    comments: CommentsRecord;
    entities: Array<VideoEntityRecord>;
    videoLowURL: string;
    vanityUrls: Array<string>;
    username: string;
    description: string;
    /**
     * An array of tags.
     * As tested it's always empty, possibly deprecated.
     * @type {any}
     */
    tags: Array<any>;
    permalinkUrl: string;
    promoted: number;
    postId: number;
    profileBackground: string;
    videoUrl: string;
    followRequested: number;
    /**
     * Date string. Use `new Date` to turn it into date format.
     * @type {string}
     */
    created: string;
    shareUrl: string;
    myRepostId: number;
    following: number;
    reposts: RepostsRecord;
    likes: LikesRecord;
}

// GET https://api.vineapp.com/timelines/popular
// GET https://api.vineapp.com/timelines/posts/s/<postid>
interface PopularTimelineData {
    count: number;
    anchorStr: string;
    records: Array<VideoRecord>;
    previousPage: number;
    backAnchor: string;
    anchor: number;
    nextPage: number;
    size: number;
}

// GET https://api.vineapp.com/timelines/tags/<tag>
// Where <tag> is a string representing tag name
interface TagData {
    count: number;
    records: Array<VideoRecord>;
    nextPage: number;
    previousPage: number;
    size: number;
}
