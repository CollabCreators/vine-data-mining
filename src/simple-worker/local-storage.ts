import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import {exec} from "child_process";
import Job from "../master/job";

export default class LocalStorage {

  /**
   * Path to storage directory. Path is resolved relative to `simple-worker` folder in bin directory,
   * 	i.e. `[project_root]/bin/src/simple-worker`, where the BASE_PATH is supposed to be `[project_root]/storage`
   *
   * @type {string}
   */
  private static BASE_PATH = path.resolve(__dirname, "../../../storage/");

  /**
   * File name of data storage file.
   *
   * @type {string}
   */
  public static DATA_FILENAME = path.resolve(LocalStorage.BASE_PATH, "data.json");

  /**
   * File name of parsed data storage file.
   *
   * @type {string}
   */
  public static PARSED_DATA_FILENAME = path.resolve(LocalStorage.BASE_PATH, "parsed-data.json");

  /**
   * File name of jobs storage file.
   *
   * @type {string}
   */
  public static JOBS_FILENAME = path.resolve(LocalStorage.BASE_PATH, "jobs.json");

  /**
   * File name of size storage file.
   */
  public static SIZE_FILENAME = path.resolve(LocalStorage.BASE_PATH, "size.json");

  constructor(logPaths = false) {
    if (logPaths) {
      console.log("base path:", LocalStorage.BASE_PATH);
      console.log("data path:", LocalStorage.DATA_FILENAME);
      console.log("jobs path:", LocalStorage.JOBS_FILENAME);
      console.log("sizes path:", LocalStorage.SIZE_FILENAME);
    }
    mkdirp.sync(LocalStorage.BASE_PATH);
  }

  /**
   * Store data as a line of JSON string into data storage file.
   *
   * @param   {any}          data Data to store (will be stringified).
   *
   * @returns {Promise<any>}      Promise rejected if data stringification fails or resolved / rejected based on
   *                                      appendFile success.
   */
  public storeData(data: any): Promise<any> {
    return LocalStorage.appendFile(LocalStorage.DATA_FILENAME, data);
  }

  /**
   * Read parsed data file.
   *
   * @returns {Promise<string>} Promise resolving with file contents as string.
   */
  public readParsedData(): Promise<string> {
    return LocalStorage.readFile(LocalStorage.PARSED_DATA_FILENAME);
  }

  /**
   * Read data file.
   *
   * @returns {Promise<string>} Promise resolving with file contents as string.
   */
  public readData(): Promise<string> {
    return LocalStorage.readFile(LocalStorage.DATA_FILENAME);
  }

  /**
   * Store parsed data as a line of JSON string into parsed data storage file.
   *
   * @param   {any}          data Data to store (will be stringified).
   *
   * @returns {Promise<any>}      Promise rejected if data stringification fails or resolved / rejected based on
   *                                      appendFile success.
   */
  public storeParsedData(data: any): Promise<any> {
    return LocalStorage.appendFile(LocalStorage.PARSED_DATA_FILENAME, data);
  }

  /**
   * Store a job uid to job storage file.
   *
   * @param   {Job}          job Job of which uid should be stored.
   *
   * @returns {Promise<any>}     Promise resolved / rejected based on appendFile success.
   */
  public storeJob(job: Job): Promise<any> {
    return LocalStorage.appendFile(LocalStorage.JOBS_FILENAME, job.uid);
  }

  /**
   * Store size to new line of file.
   *
   * @param   {number}       size New size to be stored.
   *
   * @returns {Promise<any>}      Promise resolved / rejected based on appendFile success.
   */
  public storeTotalJobSize(size: number): Promise<any> {
    return LocalStorage.appendFile(LocalStorage.SIZE_FILENAME, { timestamp: Date.now(), size: size });
  }

  /**
   * Get first `n` jobs from file and remove these jobs from file.
   *
   * @param   {number}  n             Number of jobs to get.
   *
   * @returns {Promise<Array<Job>>}   Promise resolving with array of `n` jobs.
   */
  public getFirstJobs(n: number): Promise<Array<Job>> {
    return new Promise((resolve, reject) => {
      // Get first `n` jobs from file.
      exec(`head -${n} ${LocalStorage.JOBS_FILENAME}`, (err, stdout: string) => {
        // Resolve promise with empty array if there was an error.
        if (err) {
          resolve([]);
        }
        // Make a promise resolving with all job uids mapped to jobs.
        let jobsPromise: Promise<Array<Job>> = new Promise((resolve) => {
          try {
            let jobsFromUid = stdout.split("\n").map((uid) => Job.JobFromUid(uid)).filter((j) => j !== null);
            resolve(jobsFromUid);
          }
          catch (e) {
            // If there was an error, resolve with empty array.
            resolve([]);
          }
        });
        // Remove first `n` fobs from file.
        exec(`tail -n+${n + 1} ${LocalStorage.JOBS_FILENAME} > ${LocalStorage.JOBS_FILENAME}`, (err) => {
          // Resolve promise with empty array if there was an error.
          if (err) {
            resolve([]);
          }
          // Resolve returned promise when jobsPromise resolves (resolved with jobs data).
          jobsPromise.then(resolve);
        });
      });
    });
  }

  /**
   * Find a job in jobs storage file.
   *
   * @param   {Job}          job Job to look for.
   *
   * @returns {Promise<Job>}     Promise resolving to given `job` if job is found or null otherwise.
   */
  public findJob(job: Job): Promise<Job> {
    return new Promise((resolve, reject) => {
      // Read jobs file.
      LocalStorage.readFile(LocalStorage.JOBS_FILENAME).then((data: string) => {
        data = data.trim();
        // File is empty, resolve with `job` (i.e. not found).
        if (data.length === 0) {
          resolve(job);
        }
        // Split data in lines.
        let lines = data.split("\n");
        let uid = job.uid;
        // Traverse through lines and resolve with true if a line matches.
        for (let i = 0; i < lines.length; i++) {
          // Job was found, resolve with null (i.e. this job exists, don't add it again).
          if (lines[i] === uid) {
            resolve(null);
          }
        }
        // No match found, resolve with `job`.
        resolve(job);
      })
      // If an error occured while reading jobs file, resolve with `job`.
        .catch(() => resolve(job));
    });
  }

  /**
   * Promise wrapper for `fs.appendFile`.
   *
   * @param   {string}       fileName Name of file to write (append) to.
   * @param   {string}       data     Data to append.
   *
   * @returns {Promise<any>}          Promise resolving when data is successfully written, or rejected with fs error.
   */
  private static appendFile(fileName: string, data: any): Promise<any> {
    let stringData: string;
    // Stringify data if it's not a string already.
    if (typeof data !== "string") {
      // Try to stringify data, catch potential error and use it to reject the promise.
      try {
        stringData = JSON.stringify(data);
      }
      catch (err) {
        return Promise.reject(err);
      }
    }
    else {
      stringData = data;
    }
    // Stringify was successful, (try to) append stringified data to file.
    return new Promise((resolve, reject) => {
      // If `err` is defined, reject will be called without right side of `||` being evaluated.
      // Otherwise right side is evaluated, calling resolve.
      // Because no data is returned when appending, resove with given data.
      fs.appendFile(fileName, `${stringData}\n`, (err) => err && reject(err) || resolve(data));
    });
  }

  /**
   * Promise wrapper for `fs.readFile`.
   *
   * @param   {string}          fileName File to read.
   *
   * @returns {Promise<string>}          Promise resolving with `data.toString`, or rejected with fs error.
   */
  private static readFile(fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // If `err` is defined, reject will be called without right side of `||` being evaluated.
      // Otherwise right side is evaluated, calling resolve with returned buffer, transformed to string.
      fs.readFile(fileName, (err, data: Buffer) => err && reject(err) || resolve(data ? data.toString() : ""));
    });
  }

}
