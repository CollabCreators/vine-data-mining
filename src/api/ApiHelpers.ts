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
  public static ProcessApiResponse(data: UserData): UserProfileData {
    return {
      username: data.username,
      userId: data.userId,
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
   * @param   {number}      userId Id of post author (used at sending request).
   * @param   {VideoRecord} data   Vine data API response.
   *
   * @returns {VineData}           Vine data with filtered fields.
   */
  public static ProcessApiResponse(userId: number, data: VideoRecord): VineData {
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
   * Filter out and parse entities which are of type mention.
   *
   * @param   {Array<VideoEntityRecord>} entities Array of vine entities.
   *
   * @returns {Array<number>}                     Array of mnetioned user id's.
   */
  private static getMentionEntities(entities: Array<VideoEntityRecord>): Array<number> {
    return entities
      // Filter out entites of type mention.
      .filter(entity => entity.type === "mention")
      // Expected url: vine://user-id/xxxxxxxxxxxxxxxxxx
      //  Matching the last `/xx...` part and returning just the `xx...` which is actual userid.
      //  This is used because other user ids aren't pointing to correct records.
      .map(entity => parseInt(entity.link.match(/\/(\d+)$/)[1], 10));
  }
}
