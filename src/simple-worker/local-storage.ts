import * as path from "path";
export default class LocalStorage {

  /**
   * Path to storage directory.
   *
   * @type {string}
   */
   private static BASE_PATH = path.resolve("./storage");

  constructor() {
  }

}
