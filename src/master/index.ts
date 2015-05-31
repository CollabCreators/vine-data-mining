import * as express from "express";
import {expressInit} from "../helpers/expressInit";
import Job from "./job";
import JobTypes from "../master/JobTypes";
import Communicator from "../helpers/communicator";
import ArrayHelper from "../helpers/arrayHelper";
import Logger from "../helpers/logger";
import {UserProfileHelper, VineHelper} from "../api/ApiHelpers";
let Orchestrate = require("orchestrate");
let CanIHazIp = require("canihazip");

export default class Master {

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
    this.jobTimeouts = {};
    this.doneJobs = [];
    // Call addJob for each job id, use JobTypes.Vine so both user and vine jobs are added.
    Master.INITIAL_USERS.forEach((id: string) => this.addJob(id));
    expressInit(port, "/master", this.setupExpressRouter, this);
    this.registerIpAtRouter().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }

  /**
   * Set up an expres API router.
   *
   * @returns {express.Router} Configured express router.
   */
  private setupExpressRouter(): express.Router {
    let router = express.Router();
    // GET /job, returns a list of jobs with most priority.
    router.get("/job/:count?", (req, res) => {
      this.logRequest(req);
      // Use count from params. Function will use default value 1 if no param is given.
      res.json(this.getNextJobs(req.params.count));
    });
    // GET /job-count, returns number of availabe jobs.
    router.get("/job-count", (req, res) => res.json(this.availableJobsCount()));
    // PUT /job, complete jobs with data.
    router.put("/job", (req, res) => {
      this.logRequest(req);
      this.processPutRequest(req.body.data).then((ok: boolean) => {
        console.log("Put request resolved with", ok);
        res.json({ ok: ok });
      }).catch((err) => {
        console.error(err);
        res.json({ ok: false });
      });
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
  }

  /**
   * Process a router put request
   *
   * @param   {(Array)<Object>}    data `req.body.data`
   *
   * @returns {Promise<boolean>}        Promise resolving with value of `completeJobs` success.
   */
  private processPutRequest(data): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log("Received data:", data);
      // Map data back to jobs.
      let receivedJobs = data.map((data) => {
        // Parse type, and return null if failed to find type.
        let type = JobTypes.parse(data.type);
        if (type === JobTypes.Unknown) {
          return null;
        }
        let parsedData;
        // User `UserProfileHelper` if user job or `VineHelper` if vine job.
        if (type === JobTypes.User) {
          parsedData = UserProfileHelper.ProcessApiResponse(data.id, data);
        }
        else {
          parsedData = VineHelper.ProcessApiResponse(data.id, data);
        }
        // Return new job using parsed data and priority from data (if given, otherwise default value is used).
        return new Job(parsedData, data.priority);
      }).filter((job) => job !== null); // Filter null jobs (i.e. unknown type).
      Logger.logJobs("Received jobs", receivedJobs);
      this.completeJobs(receivedJobs)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  /**
   * Add a job to list of jobs.
   *
   * @param   {string} id Job data.
   */
  private addJob(id: string): void {
    // Stop addition if id is not string or if it's of length 0.
    if (typeof id !== "string" || id.length === 0) {
      return;
    }
    // Always add both user and vine job types.
    let newJobs: Array<Job> = [
      new Job({ type: JobTypes.User, id: id }),
      new Job({ type: JobTypes.Vine, id: id })
    ];
    // Filter jobs to remove already done jobs or jobs which are in progress.
    let jobsToAdd = newJobs.filter((j) => {
      if (this.doneJobs.indexOf(j.uid) !== -1) {
        return false;
      }
      let jobMatch = Job.Find(j, this.jobs, true);
      if (jobMatch !== null) {
        jobMatch.bumpPriority();
        return false;
      }
      return true;
    });
    // If filtered jobs aren't empty, add them to list of current jobs.
    if (jobsToAdd.length > 0) {
      Array.prototype.push.apply(this.jobs, jobsToAdd);
      Logger.logJobs("Added jobs:", jobsToAdd);
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
    let jobs = Job.FilterIdle(this.jobs).slice(0, count).map((job) => {
      job.markActive();
      this.jobTimeouts[job.uid] = setTimeout(() => job.resetState(), Master.JOB_TIMEOUT);
      // Return job to add it to mapped jobs.
      return job;
    });
    Logger.logJobs("Jobs sent as a response:", jobs);
    return jobs;
  }

  /**
   * Get number of available jobs.
   *
   * @returns {number}
   */
  private availableJobsCount(): number {
    return Job.FilterIdle(this.jobs).length;
  }

  /**
   * Take an array of completed jobs and remove them from stored jobs.
   *
   * @param {Array<Job>} completeJobs Jobs to be marked complete / removed.
   */
  private completeJobs(jobs: Array<Job>): Promise<any> {
    return new Promise((resolve, reject) => {
      // Filter out jobs which are of type vine and are a repost (based on API response).
      jobs = jobs.filter((job) => job.data.type === JobTypes.Vine && !job.data.isRepost);
      // If there are no jobs to store, resolve promise right away.
      if (jobs.length === 0) {
        resolve();
      }
      Logger.logJobs("Request to store", jobs);
      this.storeJobsData(jobs).then(() => {
        console.log("Jobs stored to Orchestrate successfuly!");
        jobs.map((job) => {
          let localJob = Job.Find(job, this.jobs, true);
          // If job wasn't found among local jobs, further execution is not possible.
          if (localJob === null) {
            return null;
          }
          // Clear timeout and remove timer value from jobTimeouts.
          clearTimeout(this.jobTimeouts[localJob.uid]);
          delete this.jobTimeouts[localJob.uid];
          // Mark job as done.
          localJob.markDone();
          // Push job to doneJobs list so it will not be added again.
          this.doneJobs.push(localJob.uid);
          Logger.logJobs("Completed job", [localJob]);
          // Return array of unique job ids and mentions (if they exist).
          // This is *always* array, so it must be flattened.
          return ArrayHelper.mergeUnique(null, [job.data.id], job.data.mentions || []);
          // Filter out falsy values.
        }).filter((id, i, arr) => !!id)
        // Flatten array.
          .reduce((a, b) => a.concat(b))
        // Keep only unique values.
          .filter((id, i, arr) => ArrayHelper.isUnique(id, i, arr))
          .forEach((idToAdd: string) => this.addJob(idToAdd));
        this.cleanDoneJobs();
        resolve();
      })
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
  private storeJobsData(jobs: Array<Job>): Promise<any> {
    return new Promise((resolve, reject) => {
      // Map `jobs` to promises which resolve when put request successfully ends.
      let dbPromises = jobs.map((j: Job) => this.orchestrateDb.put(Master.ORCHESTRATE_COLLECTION, j.uid, j.data));
      // Resolve returned promise when all `dbPromises` resolve or reject it if any of them fails.
      Promise.all(dbPromises).then(resolve).catch(reject);
    });
  }

  /**
   * Remove jobs which are fulfilled or have failed.
   */
  private cleanDoneJobs(): void {
    this.jobs = Job.Sort(Job.FilterIdle(this.jobs, true));
  }

  /**
   * Register IP of node with router.
   *
   * @returns {Promise<any>} Promise resolving when IP is registed successfully.
   */
  private registerIpAtRouter(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log("Begin register address...");
      // Get IP of this machine.
      CanIHazIp().then((ip: string) => {
        console.log("Got IP address:", ip);
        // Register `ip` with router.
        Communicator.registerAddress(ip)
          .then(() => {
          console.log("Address register successful!");
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
      process.on(event, () => Communicator.unregisterAddress());
    });
  }

}
