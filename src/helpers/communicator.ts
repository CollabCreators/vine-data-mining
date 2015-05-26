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
   * Register an ipAddress on router.
   *
   * @param   {string}       server    Server address where router is running.
   * @param   {string}       endpoint  Server endpoint where router is listening.
   * @param   {string}       ipAddress IP address to be registered.
   *
   * @returns {Promise<any>}           Promise which will be resolved when ipAddress is successfully registered.
   */
  public static registerAddress(server: string, endpoint: string, ipAddress: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Send a put request with value of `ipAddress` to `server`/`endpoint`.
      request.put({
        url: `${server}/${endpoint}/${ipAddress}`
      },
        (err, httpResponse, body: string) => {
          // Check for errors, calls reject if there are any.
          Communicator.checkErrorAndReject(err, httpResponse, body, reject);
          // If address in response (new address) doesn't match the address which was sent, try to register it again.
          if (JSON.parse(body).address !== ipAddress) {
            Communicator.registerAddress(server, endpoint, ipAddress).then(resolve);
          }
          else {
            // Register was successful, resolve returned promise.
            resolve();
          }
        });
    });
  }

  /**
   * Unregister an address froum router.
   *
   * @param   {string}       server    Server address where router is running.
   * @param   {string}       endpoint  Server endpoint where router is listening.
   */
  public static unregisterAddress(server: string, endpoint: string): void {
    // Send a DELETE request to `server`/`endpoint`.
    // Don't wait for a response so this function (and it's process) can exit as quickly as possible.
    request.del({ url: `${server}/${endpoint}` });
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
