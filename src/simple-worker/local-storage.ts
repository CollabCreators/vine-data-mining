import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import {exec} from "child_process";
import Job from "../master/job";

export default class LocalStorage {

  /**
   * Path to storage directory.
   *
   * @type {string}
   */
  private static BASE_PATH = "./storage/";

  /**
   * File name of data storage file.
   *
   * @type {string}
   */
  private static DATA_FILENAME = path.resolve(LocalStorage.BASE_PATH, "data.json");

  /**
   * File name of jobs storage file.
   *
   * @type {string}
   */
  private static JOBS_FILENAME = path.resolve(LocalStorage.BASE_PATH, "jobs.json");

  /**
   * File name of size storage file.
   */
  private static SIZE_FILENAME = path.resolve(LocalStorage.BASE_PATH, "size.json");

  constructor() {
    mkdirp.sync(LocalStorage.BASE_PATH);
  }

  /**
   * Store data as a line of JSON string into data storage file.
   *
   * @param   {any}          data Data to store (will be stringified);
   *
   * @returns {Promise<any>}      Promise rejected if data stringification fails or resolved / rejected based on
   *                                      appendFile success.
   */
  public storeData(data: any): Promise<any> {
    return LocalStorage.appendFile(LocalStorage.DATA_FILENAME, data);
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
