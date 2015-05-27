export default class ArrayHelper {

  /**
   * Merge multiple arrays, keep unique values.
   *
   * @param   {Array<any>} ...arrays Arrays to be merged.
   *
   * @returns {Array<any>}           Merged arrays.
   */

  /**
  * Merge multiple arrays, keep unique values.
   *
   * @param   {(x: any, i: number, arr: Array<any>) => boolean} uniqueFn  Function used to determine if value is unique,
   *                    																			pass `null` to use default to primitive value comparison.
   * @param   {Array<any>}                                      ...arrays Arrays to be merged.
   *
   * @returns {Array<any>}           Merged arrays.
   */
  public static mergeUnique(uniqueFn: (x: any, i: number, arr: Array<any>) => boolean, ...arrays: Array<any>): Array<any> {
    if (!uniqueFn) {
      uniqueFn = (x, i, arr) => arr.indexOf(x) === i;
    }
    return arrays.reduce((a, b) => a.concat(b)).filter(uniqueFn);
  }
}
