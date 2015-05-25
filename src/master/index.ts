import * as express from "express";
import expressInit from "../helpers/expressInit";
import VineApi from "../api/VineApi";
import Job from "./job";
let Orchestrate = require("orchestrate");
let CanIHazIp = require("canihazip");

class MasterNode {

  /**
   * Id's of 5 most followed users (my assuption).
   * @type {Array<string>}
   */
  private static INITIAL_USERS = [
    "934940633704046592", // KingBach
    "935302706900402176", // Nash Grier
    "912665006900916224", // Brittany Furlan
    "912482556656623616", // Rudy Mancuso
    "925163818496167936"  // Curtis Lepore
  ];

  private static ORCHESTRATE_COLLECTION = "vine";
  private orchestrateDb: any;
  private jobs: Array<Job>;

  constructor(port: number) {
    if (!process.env.ORCHESTRATE_KEY) {
      throw Error("Missing environment variable ORCHESTRATE_KEY.");
    }
    this.orchestrateDb = Orchestrate(process.env.ORCHESTRATE_KEY);
    this.jobs = [];
    expressInit(port, "/master", this.setupExpressRouter, this);
  }

  /**
   * Set up an expres API router.
   *
   * @returns {express.Router} Configured express router.
   */
  private setupExpressRouter(): express.Router {
    let router = express.Router();
    router.get("/", (req, res) => { res.json({}) });
    return router;
  }

  /**
   * Add a job to list of jobs.
   *
   * @param   {StoredData} data Job data.
   */
  private addJob(data: StoredData): void {
    this.jobs.push(new Job(data));
    this.jobs = Job.Sort(this.jobs);
  }

  /**
   * Get next `count` jobs with highest priority.
   *
   * @param   {number = 5} count How many jobs take.
   *
   * @returns {Array<Job>}       Array of jobs.
   */
  private getNextJobs(count: number = 5): Array<Job> {
    // Filter jobs to keep only idle, then take first `count` jobs.
    // Assuming that jobs are already sorted, this is `count` most important jobs.
    let jobs = Job.FilterIdle(this.jobs).slice(0, count);
    for (let i = 0; i < jobs.length; i++) {
      jobs[i].markActive();
    }
    return jobs;
  }

  /**
   * Take an array of completed jobs and remove them from stored jobs.
   *
   * @param {Array<Job>} completeJobs Jobs to be marked complete / removed.
   */
  private completeJobs(jobs: Array<Job>): Promise<any> {
    return new Promise((resolve, reject) => {
      // Attempt to store jobs data.
      this.storeJobData(jobs).then(() => {
        // Filter `this.jobs` to keep values which are not found in `jobs` array and then resolve the promise.
        this.jobs = this.jobs.filter((tj: Job) => !jobs.some((j: Job) => j.equals(tj)));
        resolve();
      })
      // Reject returned promise if storeJobData failed.
        .catch(reject);
    });
  }

  /**
   * Store job data to Orchestrate.
   *
   * @param   {Array<Job>}   jobs Jobs to be stored.
   *
   * @returns {Promise<any>}      Promise which resolves when data is stored or is rejected if storing fails.
   */
  private storeJobData(jobs: Array<Job>): Promise<any> {
    return new Promise((resolve, reject) => {
      // Map `jobs` to promises which resolve when put request successfully ends.
      let dbPromises = jobs.map((j: Job) => this.orchestrateDb.put(MasterNode.ORCHESTRATE_COLLECTION, j.data.id, j.data));
      // Resolve returned promise when all `dbPromises` resolve or reject it if any of them fails.
      Promise.all(dbPromises).then(resolve).catch(reject);
    });
  }

  /**
   * Get public IP of this machine.
   *
   * @returns {Promise<string>} Promise resolving to IPv4 string.
   */
  private getPublicIp(): Promise<string> {
    return CanIHazIp();
  }

}
