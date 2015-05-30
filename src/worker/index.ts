import VineApi from "../api/VineApi";
export default class Worker {

  /**
   * Instance of Vine API communicator.
   *
   * @type {VineApi}
   */
  private vineApi: VineApi;

  constructor(masterPort: number) {
    this.vineApi = new VineApi();
  }

}
