import VineApi from "../api/VineApi";
import Job from "../master/job";
import JobTypes from "../master/JobTypes";
import LocalStorage from "./local-storage";

export default class JobStore {

  /**
   * Minimum number of followers of user to add.
   *
   * @type {Number}
   */
  private static MIN_FOLLOWERS = 10000;

  /**
   * Limit of how much jobs can be stored in RAM at one time.
   *
   * @type {number}
   */
  private static MAX_JOBS_IN_RAM = 5000;

  /**
   * Upper bound of jobs size, before reading in more jobs.
   *
   * @type {Number}
   */
  private static MIN_JOBS_UPPER = 500;

  /**
   * Lower bound of jobs size, before reading in more jobs.
   *
   * @type {Number}
   */
  private static MIN_JOBS_LOWER = 400;

  /**
   * Vine API connector utility.
   *
   * @type {VineApi}
   */
  private vineApi: VineApi;

  /**
   * LocalStorage manager.
   *
   * @type {LocalStorage}
   */
  private localStorage: LocalStorage;

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
   * Counter of all jobs (in RAM + stored).
   *
   * @type {number}
   */
  private totalJobCount: number;

  /**
   * Initialize a new JobStore.
   */
  constructor() {
    this.vineApi = new VineApi();
    this.localStorage = new LocalStorage();
    // Initialize arrays.
    this.doneJobs = [];
    this.jobs = [];
    this.totalJobCount = 0;
    this.registerExitEvents();
  }

  /**
   * Get next job from list of jobs.
   *
   * NOTE: Get next job from the list ([0] is used because splice always returns an array).
   *
   * @returns {Job}
   */
  get next(): Job {
    if (this.totalJobCount === 0) {
      return null;
    }
    // If job length is below threshold, try to add more from file.
    if (this.jobs.length > JobStore.MIN_JOBS_LOWER && this.jobs.length < JobStore.MIN_JOBS_UPPER) {
      this.getStoredJobs();
    }
    // Reduce job count by 1.
    this.totalJobCount--;
    // Also store updated job size to file.
    this.localStorage.storeTotalJobSize(this.totalJobCount);
    // Return next job from list.
    return this.jobs.splice(0, 1)[0];;
  }

  /**
   * Try to get next jobs from job store.
   *
   * @returns {Promise<number>} Number of jobs collected.
   */
  public getStoredJobs(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.localStorage.getFirstJobs(JobStore.MIN_JOBS_UPPER).then((newJobs) => {
        if (newJobs) {
          // If newJobs exits, concat them to existing jobs and resolve promise with added length.
          this.jobs.concat(newJobs);
          resolve(newJobs.length);
        }
        // New jobs are undefined, resolve with length 0.
        resolve(0);
      });
    });
  }

  /**
   * Get API data based on job type.
   *
   * @param   {Job}          job Job to get data for.
   *
   * @returns {Promise<any>}     Promise resolving to either UserProfileData or an Array<VineData>.
   */
  public fetchVineData(job: Job): Promise<any> {
    console.log(`Fetching Vine data for ${job.uid}...`);
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
      return Promise.reject(Error("putToDatabase failed, data = null"));
    }
    // If data is not an array, wrap it into one.
    if (!Array.isArray(data)) {
      data = [data];
    }
    console.log(`Store ${data.length} data record${data.length === 1 ? "s" : ""}.`);
    // Map data to an array of promises, each resolving when Orchestrate PUT request finishes.
    let dbPromises = data.map((d) => {
      // If data is user and their follower count is less than `MIN_FOLLOWERS`, do not add them.
      if (d.type === JobTypes.User && d.followerCount < JobStore.MIN_FOLLOWERS) {
        return Promise.resolve(null);
      }
      return this.localStorage.storeData(d);
    });
    // Return promise resolving when all Orchestrate database promises finish.
    return Promise.all(dbPromises);
  }

  /**
   * Add jobs to `doneJobs` array.
   *
   * @param {Job} job Job to be stored to list of done jobs.
   */
  public markAsDone(job: Job): void {
    console.log(`Job ${job.uid} is done!`);
    // Check to make sure this job is not on the list already.
    if (this.doneJobs.indexOf(job.uid) === -1) {
      this.doneJobs.push(job.uid);
    }
  }

  /**
   * Add user and vine job to the list of pending jobs.
   *
   * @param {string} uid UserId of user which should be added as jobs.
   *
   * @returns {Promise<any>}      Promise resolving when all jobs are added.
   */
  public add(uid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Initialize new jobs of type User and Vine.
      let findPromises = [new Job({ type: JobTypes.User, id: uid }), new Job({ type: JobTypes.Vine, id: uid })]
      // Filter out pending and done jobs.
        .filter((j: Job) => this.doneJobs.indexOf(j.uid) === -1 && Job.Find(j, this.jobs, true) === null)
      // Push remaining jobs (if any) to the list of pending jobs.
        .map((j) => this.localStorage.findJob(j));

      Promise.all(findPromises).then((foundJobs) => {
        // When all `findJob` promises resolve, filter jobs which are `null` (i.e. found)
        // add add jobs which weren't found to list of jobs. Using map to get actually added jobs.
        let added = foundJobs.filter((j) => j !== null).map((j: Job) => this.jobs.push(j));
        // Add added length to total count.
        this.totalJobCount += added.length;
        console.log(`Added ${added.length} new jobs for user ${uid}, new job count: ${this.jobs.length} (total: ${this.totalJobCount})`);
        // Also store updated job size to file.
        this.localStorage.storeTotalJobSize(this.totalJobCount);

        let jobLen = this.jobs.length;
        // Check if length is more than set threshold, if it is, store half of array in jobs file.
        if (jobLen > JobStore.MAX_JOBS_IN_RAM) {
          // Take last half of array.
          let jobsToStore = this.jobs.splice(jobLen / 2, jobLen);
          Promise.all(jobsToStore.map((j) => this.localStorage.storeJob(j))).then(() => {
            console.log(`Job array "overflow", stored ${jobsToStore.length} jobs`);
            resolve();
          }).catch(reject);
        }
        // If job length is not exceeded, just resolve the promise.
        resolve();
      }).catch(reject);
    });
  }

  private registerExitEvents(): void {
    // Register event for each of exit/kill events.
    ["exit", "SIGINT", "uncaughtException"].forEach((event) => {
      // Store jobs currenly in RAM before exiting.
      process.on(event, () => this.jobs.forEach((j) => this.localStorage.storeJob(j)));
    });
  }

}
