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
    this.jobEventEmitter.on("job.done", this.nextJob);
    this.workerProfiler = new WorkerProfiler(this.jobEventEmitter, Worker.TIME_THRESHOLD);
    this.jobSize = 1;
    // Start execution.
    this.nextJob();
  }

  /**
   * Get next job and execute it.
   */
  private nextJob(): void {
    Communicator.getAddress().then((address: string) => {
      this.masterAddress = `http://${address}:${this.masterPort}/master`;
      this.getJob(this.jobSize).then((jobs: Array<Job>) => {
        this.execJob(jobs).then((completedJobs: Array<Job>) => {
          // Emit end event.
          this.jobEventEmitter.emit("job.done");
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
        return parseInt(body, 10) >= count;
      }).then(() => {
        request.get({ url: `${this.masterAddress}/job/${count}` },
          (err, httpResponse, body: string) => {
            Communicator.checkErrorAndReject(err, httpResponse, body, reject);
            try {
              resolve(JSON.parse(body));
            }
            catch (e) {
              reject(Error("Error occured while parsing JSON response."));
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
      // If resolved job is null (i.e. job type was unknown), remove it from resolved jobs.
      }).filter((resolvedJob) => resolvedJob !== null);
      // Resolve returned promise with completed jobs.
      resolve(resolvedJobs);
    });
  }

}
