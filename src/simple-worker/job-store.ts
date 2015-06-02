import VineApi from "../api/VineApi";
import Job from "../master/job";
import JobTypes from "../master/JobTypes";
let Orchestrate = require("orchestrate");

export default class JobStore {

  /**
   * Vine API connector utility.
   *
   * @type {VineApi}
   */
  private vineApi: VineApi;

  /**
   * Orchestrate API connector utility.
   *
   * @type {any}
   */
  private orchestrateDb;

  /**
   * Array of pending jobs.
   *
   * @type {Array<Job>}
   */
  private jobs: Array<Job>;

  /**
   * Array of uids of completed jobs.
   *
   * @type {Array<string>}
   */
  private doneJobs: Array<string>;

  /**
   * Initialize a new JobStore.
   */
  constructor() {
    // Check if ORCHESTRATE_KEY environment variable is set.
    if (!process.env.ORCHESTRATE_KEY) {
      throw Error("Missing environment variable ORCHESTRATE_KEY.");
    }
    // Initialize API connectors.
    this.orchestrateDb = Orchestrate(process.env.ORCHESTRATE_KEY);
    this.vineApi = new VineApi();
    // Initialize arrays.
    this.doneJobs = [];
    this.jobs = [];
  }

}
