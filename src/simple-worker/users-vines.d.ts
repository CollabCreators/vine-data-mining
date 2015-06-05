interface UserVines extends UserProfileData {
  loopCounts: Array<number>;
  commentCounts: Array<number>;
  repostCounts: Array<number>;
  likesCounts: Array<number>;
  vinesCreated: Array<Date>;
  mentioned: Array<string>;
}
