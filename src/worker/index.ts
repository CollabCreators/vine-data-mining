import VineApi from "../api/VineApi";
import Communicator from "../helpers/communicator";

export default class Worker {

  /**
   * Instance of Vine API communicator.
   *
   * @type {VineApi}
   */
  private vineApi: VineApi;

  /**
   * Full address of master node.
   *
   * @type {string}
   */
  private masterAddress: string;

  /**
   * Start a new worker. Will need router and master running to start.
   *
   * @param   {number} masterPort Port where master node is listening.
   */
  constructor(masterPort: number) {
    this.vineApi = new VineApi();
    Communicator.getAddress().then((address: string) => {
      this.masterAddress = `http://${address}:${masterPort}/master`;
      this.run();
    });
  }

  /**
   * Run this worker.
   */
  private run(): void {

  }

}
