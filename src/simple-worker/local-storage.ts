import * as path from "path";
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

}
