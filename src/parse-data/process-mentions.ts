import LocalStorage from "../simple-worker/local-storage";

export default class ProcessMentions {

  private static MIN_FOLLOWERS = 0;

  private localStorage: LocalStorage;
  private users: Array<UserVines>;
  private userIds: Array<string>;
  private graphData: ForceGraphData;
  private missingCount: number;
  private addedCount: number;
  private foundConnections: Array<any>;
  private allConnections: Array<any>;

  constructor() {
    this.localStorage = new LocalStorage();
    this.begin();
    this.missingCount = 0;
    this.addedCount = 0;
    this.foundConnections = [];
    this.allConnections = [];
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
        let connections = 0;
        for (let key in user.mentioned) {
          let target = this.userIds.indexOf(key);
          if (target === -1) {
            this.missingCount++;
            continue;
          }
          this.addedCount++;
          connections++;
          this.graphData.links.push({
            source: i,
            target: target,
            value: user.mentioned[key]
          });
          added = true;
        }
        let allConnections = Object.keys(user.mentioned).length;
        this.foundConnections.push({ id: user.username, c: connections });
        this.allConnections.push({ id: user.username, c: allConnections });
        console.log(`Found ${connections} for user ${user.id}`);
        console.log(`User ${user.id} has ${allConnections} in total`);
        if (!added) {
          this.graphData.links.push({
            source: i,
            target: i,
            value: 0
          });
        }
      });
      this.localStorage.storeMentions(this.graphData);
      console.log(`Missing ${this.missingCount} connections...`);
      console.log(`Added ${this.addedCount} connections...`);
      this.foundConnections = this.foundConnections.sort((a, b) => a.c - b.c);
      this.allConnections = this.allConnections.sort((a, b) => a.c - b.c);
      console.log('Data for all connections:');
      let allMin = this.allConnections[0], allMax = this.allConnections[this.allConnections.length - 1];
      let maxAvg = this.allConnections.reduce((p, c) => p + (c.c || c), 0) / this.allConnections.length;
      console.log(`Average connections: ${maxAvg }`);
      console.log(`Min connections: ${allMin.c} (${allMin.id}) | Max connections: ${allMax.c} (${allMax.id})`);
      console.log('Data for found connections:');
      let foundMin = this.foundConnections[0], foundMax = this.foundConnections[this.foundConnections.length - 1];
      let foundAvg = this.foundConnections.reduce((p, c) => p + (c.c || c), 0) / this.foundConnections.length;
      console.log(`Average connections: ${foundAvg }`);
      console.log(`Min connections: ${allMin.c} (${allMin.id}) | Max connections: ${allMax.c} (${allMax.id})`);
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
