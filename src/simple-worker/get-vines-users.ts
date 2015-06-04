import LocalStorage from "./local-storage";
import {EventEmitter} from "events";
import VineApi from "../api/VineApi";
import ArrayHelper from "../helpers/arrayHelper";
let lineReader = require("reverse-line-reader");

export default class GetVinesUsers {

  private vineApi: VineApi;
  private jobEventEmitter: EventEmitter;
  private localStorage: LocalStorage;
  private users: Array<UserProfileData>;
  private counter: number;

  constructor() {
    this.vineApi = new VineApi();
    this.jobEventEmitter = new EventEmitter();
    this.localStorage = new LocalStorage();
    this.users = [];
    this.counter = 0;
  }

  public beginWithExisting(): void {
    this.readExistingUsers()
      .then((users) => {
      this.users = users;
      this.jobEventEmitter.on("job.existing.done", () => this.doNextJob());
      this.doNextJob();
    });
  }

  private readExistingUsers(): Promise<Array<UserProfileData>> {
    return new Promise((resolve, reject) => {
      let users: Array<UserProfileData> = [];
      lineReader.eachLine(LocalStorage.PARSED_DATA_FILENAME, (line: string, last: boolean, cb: (done?: boolean) => void) => {
        if (line.trim().length === 0) {
          return cb();
        }
        try {
          let data = JSON.parse(line);
          if (data.type === 0 && data.id && users.indexOf(data.id) === -1 && data.followerCount > 50000) {
            users.push(data);
          }
          return cb();
        }
        catch (e) {
          return cb();
        }
      }).then(() => resolve(users));
    });
  }

  private doNextJob(): void {
    let userData: any = this.users.splice(0, 1)[0];
    if (!userData) {
      console.log("userData undefined, stop");
      return;
    }
    let timeLabel = `Existing job ${userData.id}`;
    // Start timer.
    console.log("Begin", timeLabel, ++this.counter);
    console.time(timeLabel);
    this.vineApi.getUserTimeline(userData.id).then((data) => {
      if (!data) {
        return Promise.resolve();
      }
      userData.loopCounts = [];
      userData.commentCounts = [];
      userData.repostCounts = [];
      userData.likesCounts = [];
      userData.vinesCreated = [];
      userData.mentioned = [];
      data.forEach((d: VineData) => {
        userData.loopCounts.push(d.loopCount);
        userData.commentCounts.push(d.commentsCount);
        userData.repostCounts.push(d.repostsCount);
        userData.likesCounts.push(d.likesCount);
        userData.vinesCreated.push(d.created);
        userData.mentioned = ArrayHelper.mergeUnique(null, userData.mentioned, d.mentions);
      })
      console.log(`stored ${data.length} vine records for user ${userData.id}`);
      console.timeEnd(timeLabel);
      return this.localStorage.storeData(userData);
    })
    // Catch any errors in chain.
      .catch((err) => console.error(err.stack))
    // Emit done event (always, even if there was an error).
      .then(() => this.jobEventEmitter.emit("job.existing.done"));
  }

}
