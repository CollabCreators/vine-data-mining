import VineApi from "../api/VineApi";
import Communicator from "../helpers/communicator";
import {EventEmitter} from "events";
import * as request from "request";
import Job from "../master/job";

export default class Worker {

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
    // Start execution.
    this.nextJob();
  }

  /**
   * Get next job and execute it.
   */
  private nextJob(): void {
    Communicator.getAddress().then((address: string) => {
      this.masterAddress = `http://${address}:${this.masterPort}/master`;
      this.run();
    });
  }

  /**
   * Run this worker.
   */
  private run(): void {

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

}
