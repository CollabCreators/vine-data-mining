import {EventEmitter} from "events";
let now = require("performance-now");

export default class WorkerProfiler {

  /**
   * Array of times from start to stop.
   *
   * @type {Array<Measure>}
   */
  private times: Array<number>;

  /**
   * Array of flags if time was below threshold.
   *
   * @type {Array<boolean>}
   */
  private wasBelowThreshold: Array<boolean>;

  /**
   * Current start time.
   *
   * @type {number}
   */
  private currentStart: number;

  /**
   * Event system for managing when job starts / ends.
   *
   * @type {EventEmitter}
   */
  private jobEventEmitter: EventEmitter;

  /**
   * Start the profiler.
   *
   * @param   {number} threshold Threshold of job execution time.
   */
  constructor(public threshold: number) {
    this.resetTimes();
    this.jobEventEmitter = new EventEmitter();
    // Set event listener for job.start, set start time.
    this.jobEventEmitter.on("job.start", () => this.currentStart = now());
    // Set event listener for job.done, calculate time and store size.
    this.jobEventEmitter.on("job.done", () => {
      // Calculate time.
      let time = now() - this.currentStart;
      // Add time to times array.
      this.times.push(time);
      // Add below threshold flag.
      this.wasBelowThreshold.push(time < this.threshold);
    });
  }

  /**
   * Reset arrays.
   */
  public resetTimes(): void {
    this.times = [];
    this.wasBelowThreshold = [];
  }

  /**
   * Get average execution time of a single job.
   *
   * @returns {number}
   */
  public averageTime(): number {
    return this.times.reduce((a, b, i) => a + b) / this.times.length;
  }

  /**
   * Get number of occurances when time was below threshold.
   *
   * @param   {number = 10) lastN Last `n` times to check.
   *
   * @returns {number}            Count of occurances when time was below threshold.
   */
  public timesBelowThreshold(lastN: number = 10): number {
    // Negative slice returns elements from behind. Filter can just use value, since it's a flag.
    return this.wasBelowThreshold.slice(-lastN).filter(wasBelow => wasBelow).length;
  }

}
