import LocalStorage from "../simple-worker/local-storage";

export default class ProcessMentions {

  private static MIN_FOLLOWERS = 5e6;

  private localStorage: LocalStorage;
  private users: Array<UserVines>;
  private userIds: Array<string>;
  private graphData: ForceGraphData;

  constructor() {
    this.localStorage = new LocalStorage();
    this.begin();
  }

  private begin(): void {
    this.readUserData().then(() => {
      this.graphData = {
        nodes: [],
        links: []
      };
      this.users.forEach((user, i) => {
        this.graphData.nodes.push({
          name: user.username,
          group: this.getUserGroup(user.followerCount)
        });
        let added = false;
        for (let key in user.mentioned) {
          let target = this.userIds.indexOf(key);
          if (target === -1) {
            continue;
          }
          this.graphData.links.push({
            source: i,
            target: target,
            value: user.mentioned[key]
          });
          added = true;
        }
        if (!added) {
          this.graphData.links.push({
            source: i,
            target: i,
            value: 0
          });
        }
      });
      this.localStorage.storeMentions(this.graphData);
    });
  }

  private readUserData(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.localStorage.readData().then((data: string) => {
        this.users = data.split("\n")
          .map((l) => l.trim().length === 0 ? null : JSON.parse(l))
          .filter((u) => u !== null && u.type === 0 && u.followerCount > ProcessMentions.MIN_FOLLOWERS);
        this.userIds = this.users.map((user) => user.id);
        resolve();
      });
    });
  }

  private getUserGroup(followerCount: number): number {
    if (followerCount < 100000) return 0;  // 100k
    if (followerCount < 500000) return 1;  // 500k
    if (followerCount < 1000000) return 2; // 1M
    if (followerCount < 5000000) return 3; // 5M
    return 4;
  }

}
