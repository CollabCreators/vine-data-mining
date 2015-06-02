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

  /**
   * Get next job from list of jobs.
   *
   * NOTE: Get next job from the list ([0] is used because splice always returns an array).
   *
   * @returns {Job}
   */
  get next(): Job { return this.jobs.splice(0, 1)[0] }

  /**
   * Get API data based on job type.
   *
   * @param   {Job}          job Job to get data for.
   *
   * @returns {Promise<any>}     Promise resolving to either UserProfileData or an Array<VineData>.
   */
  public fetchVineData(job: Job): Promise<any> {
    // If job is of unknown type, resolve promise with null.
    if (!JobTypes.isJobType(job.type)) {
      return Promise.resolve(null);
    }
    return job.type === JobTypes.User ? this.vineApi.getUserProfile(job.id) : this.vineApi.getUserTimeline(job.id);
  }

  /**
   * Store data to Orchestrate database.
   *
   * @param   {Array<any>}   data Array of data to be stored.
   *
   * @returns {Promise<any>}      Promise resolving when all data is stored.
   */
  public putToDatabase(data: Array<any>): Promise<any> {
    // Prevent storing if data is a falsy value.
    if (!data) {
      return Promise.reject(Error("putToDatabase data = null"));
    }
    // If data is not an array, wrap it into one.
    if (!Array.isArray(data)) {
      data = [data];
    }
    // Map data to an array of promises, each resolving when Orchestrate PUT request finishes.
    let dbPromises = data.map((d) => new Promise((resolve, reject) => {
      // Workaround to make orchestrate response compatible with Promise.
      // Resolve with stored data object instead of Orchestrate response.
      // On fail, resolve with null value just so all promises eventually resolve.
      this.orchestrateDb.put("vine", `d.type-d.id`, d).then(() => resolve(d)).fail(() => resolve(null));
    }));
    // Return promise resolving when all Orchestrate database promises finish.
    return Promise.all(dbPromises);
  }

  /**
   * Add jobs to `doneJobs` array.
   *
   * @param {Job} job Job to be stored to list of done jobs.
   */
  public markAsDone(job: Job): void {
    // Check to make sure this job is not on the list already.
    if (this.doneJobs.indexOf(job.uid) === -1) {
      this.doneJobs.push(job.uid);
    }
  }

  /**
   * Add user and vine job to the list of pending jobs.
   *
   * @param {string} uid UserId of user which should be added as jobs.
   */
  public add(uid: string): void {
    // Initialize new jobs of type User and Vine.
    [new Job({ type: JobTypes.User, id: uid }), new Job({ type: JobTypes.Vine, id: uid })]
    // Filter out pending and done jobs.
      .filter((j: Job) => this.doneJobs.indexOf(j.uid) === -1 || Job.Find(j, this.jobs, true) === null)
    // Push remaining jobs (if any) to the list of pending jobs.
      .forEach((j: Job) => this.jobs.push(j));
  }

}
