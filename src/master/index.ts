import * as express from "express";
import {expressInit} from "../helpers/expressInit";
import VineApi from "../api/VineApi";
import Job from "./job";
import {JobTypes} from "../api/ApiHelpers";
import Communicator from "../helpers/communicator";
let Orchestrate = require("orchestrate");
let CanIHazIp = require("canihazip");

class MasterNode {

  /**
   * Id's of 5 most followed users (my assuption).
   *
   * @type {Array<string>}
   */
  private static INITIAL_USERS = [
    "934940633704046592", // KingBach
    "935302706900402176", // Nash Grier
    "912665006900916224", // Brittany Furlan
    "912482556656623616", // Rudy Mancuso
    "925163818496167936"  // Curtis Lepore
  ];

  /**
   * Name of Orchestrate database collection.
   *
   * @type {String}
   */
  private static ORCHESTRATE_COLLECTION = "vine";

  /**
   * Address of router server.
   *
   * @type {String}
   */
  private static ROUTER_SERVER = "https://gresak.io:9631";

  /**
   * Endpoint of router.
   *
   * @type {String}
   */
  private static ROUTER_ENDPOINT = "router";

  /**
   * Timeout before job resets (5min).
   *
   * @type {number}
   */
  private static JOB_TIMEOUT = 5 * 60 * 1000;

  /**
   * Orchestrate database connector.
   *
   * @type {any}
   */
  private orchestrateDb: any;

  /**
   * Array of currently pending jobs.
   *
   * @type {Array<Job>}
   */
  private jobs: Array<Job>;

  /**
   * Key - value store of job setTimeout timers.
   *
   * @type {Object}
   */
  private jobTimeouts: Object;

  /**
   * Array of uids of completed jobs.
   *
   * @type {Array<string>}
   */
  private doneJobs: Array<string>;

  constructor(port: number) {
    // Check if ORCHESTRATE_KEY environment variable is set.
    if (!process.env.ORCHESTRATE_KEY) {
      throw Error("Missing environment variable ORCHESTRATE_KEY.");
    }
    // Initialize orchestrate database connector.
    this.orchestrateDb = Orchestrate(process.env.ORCHESTRATE_KEY);
    // Map initial users to user jobs.
    this.jobs = [];
    // Call addJob for each job id, use JobTypes.Vine so both user and vine jobs are added.
    MasterNode.INITIAL_USERS.forEach((id: string) => this.addJob({ type: JobTypes.Vine, id: id }));
    this.jobTimeouts = {};
    this.doneJobs = [];
    expressInit(port, "/master", this.setupExpressRouter, this);
    this.registerIpAtRouter();
  }

  /**
   * Set up an expres API router.
   *
   * @returns {express.Router} Configured express router.
   */
  private setupExpressRouter(): express.Router {
    let router = express.Router();
    // GET /job, returns a list of jobs with most priority.
    router.get("/job", (req, res) => {
      this.logRequest(req);
      res.json(this.getNextJobs());
    });
    // PUT /job, complete jobs with data.
    router.put("/job", (req, res) => {
      this.logRequest(req);
      this.completeJobs(req.body.data);
    });
    return router;
  }

  /**
   * Logs remote address and data, if put request.
   *
   * @param   {any}  req  Express request object, used to log client IP and received data.
   */
  private logRequest(req: any): void {
    console.log("-----------------------------------------------------");
    console.log(`${req.method} request from`, (req.headers["x-forwarded-for"] || req.connection.remoteAddress));
    // If it was PUT request, log received data.
    if (req.method === "PUT") {
      console.log(req.body.data);
    }
  }

  /**
   * Add a job to list of jobs.
   *
   * @param   {StoredData} data Job data.
   */
  private addJob(data: StoredData): void {
    // If data is a falsy value or data.type is not a number (JobType is represented as a number) or
    // id is not a string, do not add the job.
    if (!data || typeof data.type !== "number" || typeof data.id !== "string") {
      return;
    }
    // Job of type User is added in both type cases. Use just the necessary data for new job.
    let newJobs: Array<Job> = [new Job({ type: JobTypes.User, id: data.id })];
    // If data is of type vine, also add job with type vine.
    if (data.type === JobTypes.Vine) {
      newJobs.push(new Job({ type: JobTypes.Vine, id: data.id }));
    }
    // Filter jobs to remove already done jobs or jobs which are in progress.
    let jobsToAdd = newJobs.filter((j) => this.doneJobs.indexOf(j.uid) === -1 && Job.Find(j, this.jobs, true) !== null);
    // If filtered jobs aren't empty, add them to list of current jobs.
    if (jobsToAdd.length > 0) {
      Array.prototype.push.apply(this.jobs, jobsToAdd);
      this.jobs = Job.Sort(this.jobs);
    }
  }

  /**
   * Get next `count` jobs with highest priority.
   *
   * @param   {number = 5} count How many jobs take.
   *
   * @returns {Array<Job>}       Array of jobs.
   */
  private getNextJobs(count: number = 1): Array<Job> {
    // Filter jobs to keep only idle, then take first `count` jobs.
    // Assuming that jobs are already sorted, this is `count` most important jobs.
    return Job.FilterIdle(this.jobs).slice(0, count).map((job) => {
      job.markActive();
      this.jobTimeouts[job.uid] = setTimeout(() => job.resetState());
      // Return job to add it to mapped jobs.
      return job;
    });
  }

  /**
   * Take an array of completed jobs and remove them from stored jobs.
   *
   * @param {Array<Job>} completeJobs Jobs to be marked complete / removed.
   */
  private completeJobs(jobs: Array<Job>): Promise<any> {
    return new Promise((resolve, reject) => {

    });
  }

  /**
   * Store job data to Orchestrate.
   *
   * @param   {Array<Job>}   jobs Jobs to be stored.
   *
   * @returns {Promise<any>}      Promise which resolves when data is stored or is rejected if storing fails.
   */
  private storeJobsData(jobs: Array<Job>): Promise<any> {
    return new Promise((resolve, reject) => {
      // Map `jobs` to promises which resolve when put request successfully ends.
      let dbPromises = jobs.map((j: Job) => this.orchestrateDb.put(MasterNode.ORCHESTRATE_COLLECTION, j.uid, j.data));
      // Resolve returned promise when all `dbPromises` resolve or reject it if any of them fails.
      Promise.all(dbPromises).then(resolve).catch(reject);
    });
  }

  /**
   * Register IP of node with router.
   *
   * @returns {Promise<any>} Promise resolving when IP is registed successfully.
   */
  private registerIpAtRouter(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Get IP of this machine.
      CanIHazIp().then((ip: string) => {
        // Register `ip` with router.
        Communicator.registerAddress(MasterNode.ROUTER_SERVER, MasterNode.ROUTER_ENDPOINT, ip)
          .then(() => {
          // Add exit listeners and resolve returned promise.
          this.addExitListeners();
          resolve();
        })
        // If there was error while registering the address, reject returned promise.
          .catch(reject);
      });
    });
  }

  /**
   * Listen for exit events and unregister IP at router just before master node process exits.
   */
  private addExitListeners(): void {
    // Register event for each of exit/kill events.
    ["exit", "SIGINT", "uncaughtException"].forEach((event) => {
      // Event handler should remove IP registered with router.
      process.on(event, () => Communicator.unregisterAddress(MasterNode.ROUTER_SERVER, MasterNode.ROUTER_ENDPOINT));
    });
  }
}

new MasterNode(9999);
