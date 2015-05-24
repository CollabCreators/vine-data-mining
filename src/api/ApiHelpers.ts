/// <reference path="./api-declarations/VineAPI.d.ts"/>
/// <reference path="./StoredData.d.ts"/>

export class UserProfileHelper {

  /**
   * Collect User data that will be stored from API response.
   *
   * @param   {UserData}        user User data API response.
   *
   * @returns {UserProfileData}      User data with filtered fields.
   */
  public static ProcessApiResponse(userId: string, data: UserData): UserProfileData {
    return {
      username: data.username,
      userId: userId,
      followerCount: data.followerCount,
      loopCount: data.followerCount,
      postCount: data.postCount,
      location: data.location,
      followingCount: data.followingCount
    };
  }
}

export class VineHelper {

  /**
   * Collect Vine data that will be stored from API response.
   *
   * @param   {string}      userId Id of post author (used at sending request).
   * @param   {VideoRecord} data   Vine data API response.
   *
   * @returns {VineData}           Vine data with filtered fields.
   */
  public static ProcessApiResponse(userId: string, data: VideoRecord): VineData {
    return {
      authorId: userId,
      loopCount: data.loops.count,
      commentsCount: data.comments.count,
      tags: data.tags,
      respostsCount: data.reposts.count,
      likesCount: data.likes.count,
      created: new Date(data.created),
      mentions: VineHelper.getMentionEntities(data.entities)
    };
  }

  /**
   * Get all unique mentioned user ids from array of `VineData`.
   *
   * @param   {Array<VineData>} allData An array of `VineData`, filtered response from API.
   *
   * @returns {Array<string>}           Array of unique mentioned user ids.
   */
  public static GetUniqueMentions(allData: Array<VineData>): Array<string> {
    return allData
    // Get only array of `mentions` from `allData` array.
      .map((d: VineData) => d.mentions)
    // Flatten array of `mentions` array to a single dimension array.
      .reduce((a: Array<string>, b: Array<string>) => a.concat(b))
    // Filter out only values that have matching current index and index in array.
    // Taking advantage of fact that `.indexOf` will return first found index in array.
      .filter((e: string, i: number, arr: Array<string>) => arr.indexOf(e) === i);
  }

  /**
   * Filter out and parse entities which are of type mention.
   *
   * @param   {Array<VideoEntityRecord>} entities Array of vine entities.
   *
   * @returns {Array<string>}                     Array of mnetioned user id's.
   */
  private static getMentionEntities(entities: Array<VideoEntityRecord>): Array<string> {
    return entities
      // Filter out entites of type mention.
      .filter(entity => entity.type === "mention")
      // Expected url: vine://user-id/xxxxxxxxxxxxxxxxxx
      //  Matching the last `/xx...` part and returning just the `xx...` which is actual userid.
      //  This is used because other user ids aren't pointing to correct records.
      .map(entity => entity.link.match(/\/(\d+)$/)[1], 10);
  }
}
