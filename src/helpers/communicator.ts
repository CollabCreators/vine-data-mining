import {Promise} from "es6-promise";
import * as request from "request";

export default class Communicator {

  /**
   * Ping a server each `interval`ms until `check` returns true.
   *
   * @param   {string}                    address  Address to ping.
   * @param   {string}                    endpoint Address endpoint to ping (starting / is not needed).
   * @param   {number}                    interval Interval in ms to ping the server.
   * @param   {(string, any?) => boolean} check    Function which returns true when result is as expected.
   * @param   {boolean = false}      rejectOnError Should the promise be rejected if request to server fails?
   *
   * @returns {Promise<any>}                     Promise which is resolved when `check` returns true.
   */
  public static ping(
    address: string, endpoint: string,
    interval: number, check: (body: string, res?: any) => boolean,
    thisArg: any = this, rejectOnError: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      // Set interval to ping server. Store in variable so it can be cleaned before resolving.
      let checkInterval = setInterval(() => {
        // Send a get request to address/endpoint and
        request.get({ url: `${address}/${endpoint}` },
          (err, httpResponse, body: string) => {
            if (rejectOnError) {
              Communicator.checkErrorAndReject(err, httpResponse, body, reject);
            }
            if (check.call(thisArg, body, httpResponse)) {
              clearInterval(checkInterval);
              resolve();
            }
          });
      }, interval);
    });
  }

  /**
   * Check for errors in request response and call reject function if any errors found.
   *
   * @param {any}             err          Error from `request`.
   * @param {any}             httpResponse Response data from `request`.
   * @param {any}             body         Body from `request` response.
   * @param {(any) => any}    reject       Function which is called if there was an error in response.
   * @param {boolean = true}  checkStatus  Should status code be checked?
   */
  private static checkErrorAndReject(err: any, httpResponse: any, body: any, reject: (any) => any, checkStatus: boolean = true): void {
    // Check for error in request and call reject function.
    // Return is used so function stops, value is not expected to be used.
    if (err) {
      return reject(err);
    }
    // If checkStatus flag is true, check if response code is equal to or above 400, call reject if both is true.
    // Return is used so function stops, value is not expected to be used.
    if (checkStatus && httpResponse.statusCode >= 400) {
      return reject(Error(`Server responded with status code ${httpResponse.statusCode}:\n${body}`));
    }
  }

}
