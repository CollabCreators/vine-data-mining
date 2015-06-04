import JobStore from "./job-store";
import LocalStorage from "./local-storage";
import {EventEmitter} from "events";
let lineReader = require("reverse-line-reader");

export default class SimpleWorker {

  private static INITIAL_USERS = [
    "934940633704046592", // KingBach
    "935302706900402176", // Nash Grier
    "912665006900916224", // Brittany Furlan
    "912482556656623616", // Rudy Mancuso
    "925163818496167936"  // Curtis Lepore
  ];

  private jobStore: JobStore;

  private jobEventEmitter: EventEmitter;

  constructor() {
    this.jobStore = new JobStore();
    this.jobEventEmitter = new EventEmitter();
  }

  public begin(): void {
    this.jobStore.getStoredJobs().then((count) => {
      console.log(`Found ${count} existing jobs...`);
      let promises = [Promise.resolve()];
      if (count === 0) {
        console.log("Count is 0, add initial users");
        // If there was no stored jobs, add initial users to array of jobs.
        promises = SimpleWorker.INITIAL_USERS.map((uid) => this.jobStore.add(uid));
      }
      Promise.all(promises)
        .then(() => this.doNextJob())
        .catch((err) => {
        // Initializaton error, output stack and exit with error status code.
        console.error(err.stack);
        process.exit(1);
      });
    });
    this.jobEventEmitter.on("job.done", () => this.doNextJob());
  }

  public beginWithExisting(): void {
    let userIds: Array<string> = [];
    let addPromises: Array<Promise<any>> = [];
    lineReader.eachLine(LocalStorage.PARSED_DATA_FILENAME, (line: string, last: boolean, cb: (done?: boolean) => void) => {
      if (line.trim().length === 0) {
        return cb();
      }
      try {
        let data = JSON.parse(line);
        if (data.type === 0 && data.id && userIds.indexOf(data.id) === -1 && data.followerCount > 50000) {
          addPromises.push(this.jobStore.add(data.id, true));
          userIds.push(data.id);
        }
        return cb();
      }
      catch (e) {
        return cb();
      }
    }).then(() => {
      Promise.all(addPromises).then(() => {
        this.jobEventEmitter.on("job.existing.done", () => this.doNextExistingJob());
        this.doNextExistingJob();
      });
    });
  }

  private doNextExistingJob(): void {
    let nextJob = this.jobStore.next;
    if (!nextJob) {
      // Store returned falsy value, there is no more jobs.
      this.jobEventEmitter.emit("job.existing.done");
      return;
    }
    let timeLabel = `Existing job ${nextJob.uid}`;
    // Start timer.
    console.log("Begin", timeLabel);
    console.time(timeLabel);
    this.jobStore
      .fetchVineData(nextJob)
      .then((data) => this.jobStore.putToDatabase(data))
      // Store current job as done.
        .then(() => this.jobStore.markAsDone(nextJob))
      // End timer and output the time.
        .then(() => console.timeEnd(timeLabel))
      // Catch any errors in chain.
        .catch((err) => console.error(err.stack))
      // Emit done event (always, even if there was an error).
        .then(() => this.jobEventEmitter.emit("job.existing.done"));
  }

  /**
   * Execute next job on the list.
   */
  private doNextJob(): void {
    let nextJob = this.jobStore.next;
    if (!nextJob) {
      // Store returned falsy value, there is no more jobs.
      this.jobEventEmitter.emit("job.done");
      return;
    }
    let timeLabel = `Job ${nextJob.uid}`;
    // Start timer.
    console.log("Begin", timeLabel);
    console.time(timeLabel);
    // Get API data for the job.
    this.jobStore
    // Fetch data from Vine API.
      .fetchVineData(nextJob)
    // Store received data to database.
      .then((data) => this.jobStore.putToDatabase(data))
    // For each data value, check if it's defined, if it contains mentions
    // field and then add then add each mention (userId) as new job.
      .then((data) => {
      let addDataPromises = data.map((d) => {
        if (d && Array.isArray(d.mentions)) {
          return Promise.all(d.mentions.map((id) => this.jobStore.add(id)));
        }
        return Promise.resolve();
      });
      return Promise.all(addDataPromises);
    })
    // Store current job as done.
      .then(() => this.jobStore.markAsDone(nextJob))
    // End timer and output the time.
      .then(() => console.timeEnd(timeLabel))
    // Catch any errors in chain.
      .catch((err) => console.error(err.stack))
    // Emit done event (always, even if there was an error).
      .then(() => this.jobEventEmitter.emit("job.done"));
  }

}
