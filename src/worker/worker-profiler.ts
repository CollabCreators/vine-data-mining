import {EventEmitter} from "events";
let now = require("performance-now");

export default class WorkerProfiler {

  private jobCounter = 0;

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
   * Start the profiler.
   *
   * @param   {number} threshold Threshold of job execution time.
   */
  constructor(public jobEventEmitter: EventEmitter, public threshold: number, public LOG = true) {
    this.resetTimesArrays();
    // Set event listener for job.start, set start time.
    this.jobEventEmitter.on("job.start", () => this.currentStart = now());
    // Set event listener for job.done, calculate time and store size.
    this.jobEventEmitter.on("job.done", (size: number) => {
      // Calculate time.
      let time = now() - this.currentStart;
      // Add time to times array.
      this.times.push(time);
      // Add below threshold flag.
      this.wasBelowThreshold.push(time < this.threshold);
      // Increase job counter.
      this.jobCounter++;
      // If LOG flag is set, output job log.
      if (this.LOG) {
        console.log(`Job #${this.jobCounter} (batch of ${size} jobs) completed in ${time} ms`);
      }
    });
  }

  /**
   * Reset arrays.
   */
  public resetTimesArrays(): void {
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
   * Get percent of occurrences when time was below threshold.
   *
   * @returns {number}            Percent of occurrences when time was below threshold, a value [0.0, 1.0].
   */
  public belowThresholdPercent(): number {
    // Calculate percentage of true values vs all values. Filter can just use value, since it's a flag.
    return this.wasBelowThreshold.filter(wasBelow => wasBelow).length / this.wasBelowThreshold.length;
  }

}
