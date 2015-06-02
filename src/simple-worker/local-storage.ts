import * as path from "path";
import * as mkdirp from "mkdirp";

export default class LocalStorage {

  /**
   * Path to storage directory.
   *
   * @type {string}
   */
   private static BASE_PATH = path.resolve("./storage");

  constructor() {
    mkdirp.sync(LocalStorage.BASE_PATH);
  }

}
