export default class Job {

  /**
   * Initialize new job.
   *
   * @param   {string} id       Id for this job.
   * @param   {Object} data     Job data.
   * @param   {number} priority Job priority, defaults to 1. Bigger the number, bigger the priority.
   */
  constructor(public id: string, public data: Object, public priority: number = 1) { }

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
    return this.id === other.id;
  }

  /**
   * Compare which of the two jobs has higher priority.
   *
   * @param   {Job}    other Job to compare with.
   *
   * @returns {number}       Below zero if this has lower priority, 0 if equal or above zero if bigger priority.
   */
  public compare(other: Job): number {
    return this.priority - other.priority;
  }

}
