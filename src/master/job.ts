import JobState from "./JobState";

export default class Job {

  /**
   * Number of times job can be reset before marking it failed.
   *
   * @type {Number}
   */
  public static FAIL_THRESHOLD = 3;

  /**
   * State of current job.
   *
   * @type {number}
   */
  private _state: number;

  /**
   * Counter of times this job failed.
   *
   * @type {number}
   */
  private _failCount: number;

  /**
   * Initialize new job.
   *
   * @param   {StoredData} data     Job data, including id and type.
   * @param   {number}     priority Job priority, defaults to 1. Bigger the number, bigger the priority.
   */
  constructor(public data: StoredData, public priority: number = 1) {
    this._state = JobState.Idle;
    this._failCount = 0;
  }

  /**
   * Get type of this job.
   *
   * @returns {JobType}
   */
  get type(): JobType { return this.data.type; }

  /**
   * Get id of this job.
   *
   * @returns {string}
   */
  get id(): string { return this.data.id; }

  /**
   * Get state of this job.
   * @returns {number}
   */
  get state(): number { return this._state; }

  /**
   * Generate unique ID which should differ for different job types.
   *
   * @returns {string}
   */
  get uid(): string { return `${this.type}-${this.id}`; }

  /**
   * Increase priority by 1.
   *
   * @returns {number} New priority.
   */
  public bumpPriority(): number {
    this.priority += 1;
    return this.priority;
  }

  /**
   * Reset job state back to idle, waiting for request.
   */
  public resetState(): void {
    this._state = JobState.Idle;
    this._failCount += 1;
    // If job vailed over threshold times, mark it as failed.
    if (this._failCount >= Job.FAIL_THRESHOLD) {
      this._state = JobState.Failed;
    }
  }

  /**
   * Mark this job as active, pending competion.
   */
  public markActive(): void {
    this._state = JobState.Pending;
  }

  /**
   * Mark this job as completed.
   */
  public markDone(): void {
    this._state = JobState.Fulfilled;
  }

  /**
   * Compare two jobs if equal.
   *
   * @param   {Job}             other     Job to compare with.
   * @param   {boolean = false} matchType (optional) Should type of job be matched?
   *
   * @returns {boolean}       True if jobs are equal, i.e. their id's match, false otherwise.
   */
  public equals(other: Job, matchType: boolean = false): boolean {
    return (matchType ? this.type === other.type : true) && this.data.id === other.data.id;
  }

  /**
   * Compare which of the two jobs has higher priority.
   *
   * @param   {Job}    other Job to compare with.
   *
   * @returns {boolean}       True if this job has greater priority than `other`, false otherwise.
   */
  public compare(other: Job): boolean {
    return Job.CompareJobs(this, other) <= 0;
  }

  /**
   * Compare priorities of two jobs.
   *
   * @param   {Job}    a
   * @param   {Job}    b
   *
   * @returns {number}   Less than 0 if a has more priority, 0 if equal or more than 0 if b has greater priority.
   */
  public static CompareJobs(a: Job, b: Job): number {
    return b.priority - a.priority;
  }

  /**
   * Sort an array of jobs. This will modify the array passed to function.
   *
   * @param   {Array<Job>} jobs Array of jobs to sort. Reference will be changed (sorted).
   *
   * @returns {Array<Job>}      Sorted array of jobs.
   */
  public static Sort(jobs: Array<Job>): Array<Job> {
    return jobs.sort(Job.CompareJobs);
  }

  /**
   * Filter an array of jobs to keep only idle jobs.
   *
   * @param   {Array<Job>} jobs Array to be fileterd.
   *
   * @returns {Array<Job>}      Filtere array of jobs.
   */
  public static FilterIdle(jobs: Array<Job>): Array<Job> {
    return jobs.filter((j: Job) => j.state === JobState.Idle);
  }

  /**
   * Find given job in array of jobs.
   *
   * @param   {Job}             job       Job to find.
   * @param   {Array<Job>}      jobs      Array of jobs to search for.
   * @param   {boolean = false} matchType (optional) Should type of job be matched?
   *
   * @returns {Job}                       Reference to found job from array of jobs or `null` if no matches.
   */
  public static Find(job: Job, jobs: Array<Job>, matchType: boolean = false): Job {
    // Filter jobs and return first match or null if there was no matches.
    return jobs.filter(j => j.equals(job, matchType))[0] || null;
  }

}
