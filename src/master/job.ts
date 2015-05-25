export default class Job {

  /**
   * Initialize new job.
   *
   * @param   {StoredData} data     Job data, including id and type.
   * @param   {number}     priority Job priority, defaults to 1. Bigger the number, bigger the priority.
   */
  constructor(public data: StoredData, public priority: number = 1) { }

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
   * Increase priority by 1.
   *
   * @returns {number} New priority.
   */
  public bumpPriority(): number {
    this.priority += 1;
    return this.priority;
  }

  /**
   * Compare two jobs if equal.
   *
   * @param   {Job}     other Job to compare with.
   *
   * @returns {boolean}       True if jobs are equal, i.e. their id's match, false otherwise.
   */
  public equals(other: Job): boolean {
    return this.data.id === other.data.id;
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

  public static Sort(jobs: Array<Job>): Array<Job> {
    return jobs.sort(Job.CompareJobs);
  }

}
