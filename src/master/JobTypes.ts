export default class JobTypes {
  public static User: JobType = 0;
  public static Vine: JobType = 1;
  public static Unknown: JobType = -1;

  /**
   * Check if given type is a jobType.
   *
   * @param   {any}     type Type to check.
   *
   * @returns {boolean}
   */
  public static isJobType(type: any): boolean {
    let x = parseInt(type);
    return x === JobTypes.User || x === JobTypes.Vine;
  }
}
