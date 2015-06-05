interface VinesUsers extends UserProfileData {
  loopCounts: Array<number>;
  commentCounts: Array<number>;
  repostCounts: Array<number>;
  likesCounts: Array<number>;
  vinesCreated: Array<number>;
  mentioned: Array<string>;
}
