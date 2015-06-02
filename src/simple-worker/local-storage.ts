import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

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
