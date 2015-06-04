import LocalStorage from "../simple-worker/local-storage";
let lineReader = require("reverse-line-reader");

export default class ParseData {

  private totalLineCount: number;

  private addedValues: Array<string>;

  private localStorage: LocalStorage;

  constructor() {
    this.totalLineCount = 0;
    this.addedValues = [];
    this.localStorage = new LocalStorage();
    this.begin();
  }

  private begin(): void {
    lineReader.eachLine(LocalStorage.DATA_FILENAME, (line: string, last: boolean, cb: (done?: boolean) => void) => {
      this.totalLineCount++;
      if (this.totalLineCount % 1000 === 0) {
        console.log(`Read line ${this.totalLineCount}`);
      }
      if (line.trim().length === 0) {
        console.log("Line is an empty string, skipping");
        return cb();
      }
      try {
        let data = JSON.parse(line);
        let uid = `${data.type}-${data.id}`;
        if (!uid || this.addedValues.indexOf(uid) !== -1) {
          return cb();
        }
        this.localStorage.storeParsedData(data).then(() => {
          this.addedValues.push(uid);
          console.log(`Added value ${uid}`);
          return cb();
        });
      }
      catch (e) {
        console.log(`Error while parsing line ${this.totalLineCount}, skipping`);
        cb();
      }
    });
  }

}
