import VineApi from "../api/VineApi";
import Communicator from "../helpers/communicator";
import {EventEmitter} from "events";

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
   * Event system for managing when job starts / ends.
   *
   * @type {EventEmitter}
   */
  private jobEventEmitter: EventEmitter;

  /**
   * Start a new worker. Will need router and master running to start.
   *
   * @param   {number} masterPort Port where master node is listening.
   */
  constructor(public masterPort: number) {
    this.vineApi = new VineApi();
    this.jobEventEmitter = new EventEmitter();
    this.jobEventEmitter.on("job.done", this.nextJob);
    this.nextJob();
  }
  private nextJob(): void {
    Communicator.getAddress().then((address: string) => {
      this.masterAddress = `http://${address}:${this.masterPort}/master`;
      this.run();
    });
  }

  /**
   * Run this worker.
   */
  private run(): void {

  }

}
