import VineApi from "../api/VineApi";
import Communicator from "../helpers/communicator";
import {EventEmitter} from "events";
import * as request from "request";
import Job from "../master/job";
import {JobTypes} from "../api/ApiHelpers";
import WorkerProfiler from "./worker-profiler";
import Logger from "../helpers/logger";

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
    let printError = (err) => console.error(err);
    console.log("Begin get address...");
    Communicator.getAddress().then((address: string) => {
      this.masterAddress = `http://${address}:${this.masterPort}/master`;
      console.log("Master found at", this.masterAddress);
      // Get new job of size `jobSize`.
      this.getJob(this.jobSize).then((jobs: Array<Job>) => {
        Logger.logJobs("Got jobs:", jobs);
        // Execute received jobs.
        this.execJob(jobs).then((completedJobs: Array<Job>) => {
          Logger.logJobs("Completed completedJobs:", jobs);
          // Send collected data back.
          this.sendBack(completedJobs).then(() => {
            console.log("Jobs successfully stored!");
            // Emit end event.
            this.jobEventEmitter.emit("job.done", this.jobSize);
            this.checkThreshold();
          }).catch(printError);
        }).catch(printError);
      }).catch(printError);
    }).catch(printError);
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
    console.log("Begin execJob...");
    return new Promise((resolve, reject) => {
      let jobsData = [];
      // Map `jobs` array into an array of completed jobs.
      let apiPromises = jobs.map((job) => {
        console.log(`Executing job ${job.uid}...`);
        // If job type was unknown, return immediately resolved promise.
        if (!JobTypes.isJobType(job.type)) {
          console.error("Error: unknown job type");
          return Promise.resolve();
        }
        // Determine API function based on job type and return the promise,
        let p: Promise<any>;
        if (job.type === JobTypes.User) {
          p = this.vineApi.getUserProfile(job.id);
        }
        else {
          p = this.vineApi.getUserTimeline(job.id);
        }
        // Chain to returned promise, pushes the data to array.
        p.then((data) => {
          // If length is greater than zero, data is an array of VineData records.
          if (data.length > 0) {
            for (let i = 0, len = data.length; i < len; i++) {
              jobsData.push(data[i]);
            }
          }
          // The length property doesn't exist, data is an UserProfileData record.
          else {
            jobsData.push(data);
          }
        });
        return p;
      });
      // Wait for all promises to resolve.
      Promise.all(apiPromises).then(() => {
        // Resolve returned promise with completed jobs.
        console.log("All jobs executed, got data:", jobsData);
        resolve(jobsData);
      }).catch(reject);
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
          try {
            resolve(JSON.parse(body).ok);
          }
          catch (e) {
            reject(e);
          }
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

}
