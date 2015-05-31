import VineApi from "../api/VineApi";
import Communicator from "../helpers/communicator";
import {EventEmitter} from "events";
import * as request from "request";
import Job from "../master/job";
import {JobTypes} from "../api/ApiHelpers";
import WorkerProfiler from "./worker-profiler";

export default class Worker {

  /**
   * Threshold for job execution time.
   *
   * @type {Number}
   */
  private static TIME_THRESHOLD = 5000;

  /**
   * Percentage above which the threshold is considered ok.
   *
   * @type {Number}
   */
  private static THRESHOLD_PERCENT = .85;

  /**
   * Number of times time must be above percentage to increase jobSize,
   * i.e. if threshold is exceeded 5 times, increase job size.
   *
   * @type {Number}
   */
  private static THRESHOLD_TIMES = 5;

  /**
   * Number of times to make check before resetting the counter.
   *
   * @type {Number}
   */
  private static THRESHOLD_CHECKS = 25;

  /**
   * Number of times threshold was above given percent.
   *
   * @type {number}
   */
  private thresholdExceededCount: number;

  /**
   * Number of times threshold was checked.
   *
   * @type {number}
   */
  private thresholdExceededChecks: number;

  /**
   * Instance of Vine API communicator.
   *
   * @type {VineApi}
   */
  private vineApi: VineApi;

  /**
   * Full address of master node.
   *
   * @type {string}
   */
  private masterAddress: string;

  /**
   * Event system for managing when job starts / ends.
   *
   * @type {EventEmitter}
   */
  private jobEventEmitter: EventEmitter;

  /**
   * Number of jobs to take.
   *
   * @type {number}
   */
  private jobSize: number;

  /**
   * Utility for timing execution times of jobs.
   *
   * @type {WorkerProfiler}
   */
  private workerProfiler: WorkerProfiler;

  /**
   * Start a new worker. Will need router and master running to start.
   *
   * @param   {number} masterPort Port where master node is listening.
   */
  constructor(public masterPort: number) {
    // Instantiate new Vine API without login.
    this.vineApi = new VineApi();
    // Instatiate new EventEmitter and register `job.done` event.
    this.jobEventEmitter = new EventEmitter();
    this.jobEventEmitter.on("job.done", () => this.nextJob());
    this.workerProfiler = new WorkerProfiler(this.jobEventEmitter, Worker.TIME_THRESHOLD);
    this.jobSize = 1;
    this.resetCounters();
    // Start execution.
    this.nextJob();
  }

  /**
   * Get next job and execute it.
   */
  private nextJob(): void {
    console.log("Begin get address...");
    Communicator.getAddress().then((address: string) => {
      this.masterAddress = `http://${address}:${this.masterPort}/master`;
      console.log("Master found at", this.masterAddress);
      // Get new job of size `jobSize`.
      this.getJob(this.jobSize).then((jobs: Array<Job>) => {
        Worker.logJobs("Got jobs:", jobs);
        // Execute received jobs.
        this.execJob(jobs).then((completedJobs: Array<Job>) => {
          Worker.logJobs("Completed completedJobs:", jobs);
          // Send collected data back.
          this.sendBack(completedJobs).then(() => {
            console.log("Jobs successfully stored!");
            // Emit end event.
            this.jobEventEmitter.emit("job.done", this.jobSize);
            this.checkThreshold();
          });
        });
      });
    });
  }

  /**
   * Gext next `count` job(s) from master.
   *
   * @param   {number = 1}  count Number of jobs to get.
   *
   * @returns {Promise}           Promise resolving with job data.
   */
  private getJob(count: number = 1): Promise<Array<Job>> {
    return new Promise((resolve, reject) => {
      // Check /job-count every second, accept (resolve) when response count is above `count` from argument.
      Communicator.ping(this.masterAddress, 'job-count', 1000, (body: string) => {
        let responseCount = parseInt(body, 10);
        if (responseCount < count) {
          console.log(`Waiting for ${count} jobs, there are ${responseCount} jobs at the moment...`);
          return false;
        }
        return true;
      }).then(() => {
        request.get({ url: `${this.masterAddress}/job/${count}` },
          (err, httpResponse, body: string) => {
            Communicator.checkErrorAndReject(err, httpResponse, body, reject);
            try {
              resolve(JSON.parse(body).map((d) => new Job(d.data, d.priority)));
            }
            catch (e) {
              reject(Error("Error occured while parsing getJob JSON response."));
            }
          });
      });
    });
  }

  /**
   * Execute job(s).
   *
   * @param {Array<Job>} jobs Jobs to be executed.
   *
   * @returns {Promise}       Promise, resolved when job data is successfully sent to master.
   */
  private execJob(jobs: Array<Job>): Promise<any> {
    // Emit start event.
    this.jobEventEmitter.emit("job.start");
    return new Promise((resolve, reject) => {
      // Map `jobs` array into an array of completed jobs.
      let resolvedJobs = jobs.map((job) => {
        if (!JobTypes.isJobType(job.type)) {
          return null;
        }
        // Determine API function based on job type.
        return (job.type === JobTypes.User ? this.vineApi.getUserProfile : this.vineApi.getUserTimeline)(job.id);
        return apiData;
        // If resolved job is null (i.e. job type was unknown), remove it from resolved jobs.
      }).filter((resolvedJob) => resolvedJob !== null);
      // Resolve returned promise with completed jobs.
      resolve(resolvedJobs);
    });
  }

  /**
   * Send completed jobs data back to master.
   *
   * @param   {Array<Job>}   completedJobs Array of complted jobs data.
   *
   * @returns {Promise<any>}               Promise resolved when data is successfully delivered.
   */
  private sendBack(completedJobs: Array<Job>): Promise<any> {
    return new Promise((resolve, reject) => {
      request.put({
        url: `${this.masterAddress}/job`,
        form: { data: completedJobs }
      }, (err, httpResponse, body: string) => {
          // Check for request errors and call reject function if there were any.
          Communicator.checkErrorAndReject(err, httpResponse, body, reject);
          resolve(JSON.parse(body).ok);
        });
    });
  }

  /**
   * Check if job execution times are below threshold, if this occurs `THRESHOLD_TIMES`, increase job size.
   */
  private checkThreshold(): void {
    // Check if percentage of jobs completed before `TIME_THRESHOLD` is at least `THRESHOLD_PERCENT`,
    // and increase counter if it is.
    if (this.workerProfiler.belowThresholdPercent() >= Worker.THRESHOLD_PERCENT) {
      this.thresholdExceededCount++;
    }
    // If `thresholdExceededCount` is at least `THRESHOLD_TIMES`, reset arrays and counter and increase job size.
    if (this.thresholdExceededCount >= Worker.THRESHOLD_TIMES) {
      this.resetCounters();
      this.jobSize++;
    }
    // Increase numbre of checks and if it's above `THRESHOLD_CHECKS`, reset counters.
    this.thresholdExceededChecks++;
    if (this.thresholdExceededChecks > Worker.THRESHOLD_CHECKS) {
      this.resetCounters();
    }
  }

  /**
   * Reset profiler arrays and threshold counters.
   */
  private resetCounters(): void {
    this.workerProfiler.resetTimesArrays();
    this.thresholdExceededCount = 0;
    this.thresholdExceededChecks = 0;
  }

  private static logJobs(message: string, jobs: Array<Job>): void {
    console.log(message, jobs.map(j => j.uid));
  }

}
