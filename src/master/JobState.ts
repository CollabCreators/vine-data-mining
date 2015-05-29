export default class JobStates {
  /**
   * Idle state, job is waiting for a request.
   * @type {number}
   */
  public static Idle = 0;
  /**
   * Job is currently being executed by a worker.
   * @type {number}
   */
  public static Pending = 1;
  /**
   * Job has been fullfilled.
   * @type {number}
   */
  public static Fulfilled = 2;
  /**
   * Job has failed.
   * @type {Number}
   */
  public static Failed = 3;
}
