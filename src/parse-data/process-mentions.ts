import LocalStorage from "../simple-worker/local-storage";

export default class ProcessMentions {

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
        this.graphData.nodes[i] = {
          name: user.username,
          group: this.getUserGroup(user.followerCount)
        };
        let source = i + 1;
        for (let key in user.mentioned) {
          this.graphData.links.push({
            source: source,
            target: this.userIds.indexOf(key) + 1,
            value: user.mentioned[key]
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
          .filter((u) => u !== null && u.type === 0);
        this.userIds = this.users.map((user) => user.id);
        this.userIds.unshift('null');
        resolve();
      });
    });
  }

  private getUserGroup(followerCount: number): number {
    if (followerCount < 100000) return 1;  // 100k
    if (followerCount < 500000) return 2;  // 500k
    if (followerCount < 1000000) return 3; // 1M
    if (followerCount < 5000000) return 4; // 5M
    return 5;
  }

}
