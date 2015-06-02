import JobStore from "./job-store";
import {EventEmitter} from "events";

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
    // Add initial users to array of jobs.
    SimpleWorker.INITIAL_USERS.forEach((uid) => this.jobStore.add(uid));
    this.jobEventEmitter.on("job.done", () => this.doNextJob());
    this.doNextJob();
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
      .then(this.jobStore.putToDatabase)
    // For each data value, check if it's defined, if it contains mentions
    // field and then add then add each mention (userId) as new job.
      .then((data) => data.forEach((d) => d && Array.isArray(d.mentions) && d.mentions.forEach(this.jobStore.add)))
    // Store current job as done.
      .then(() => this.jobStore.markAsDone(nextJob))
    // End timer and output the time.
      .then(() => console.timeEnd(timeLabel))
    // Emit done event.
      .then(() => this.jobEventEmitter.emit("job.done"))
      .catch((err) => console.error(err.stack));
  }

}
