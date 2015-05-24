import {Promise} from "es6-promise";
import {get} from "request";

/**
 * Ping a server each `interval`ms until `checker` returns true.
 *
 * @param   {string}                  address  Address to ping.
 * @param   {string}                  endpoint Address endpoint to ping (starting / is not needed).
 * @param   {number}                  interval Interval in ms to ping the server.
 * @param   {(string) => boolean}     checker  Function which returns true when result is as expected.
 *
 * @returns {Promise<any>}                     Promise which is resolved when checker returns true.
 */
export function ping(address: string, endpoint: string, interval: number, checker: (res: string) => boolean, thisArg: any = this): Promise<any> {
  return new Promise((resolve, reject) => {
    // Set interval to ping server. Store in variable so it can be cleaned before resolving.
    let checkInterval = setInterval(() => {
      // Send a get request to address/endpoint and
      get({ url: `${address}/${endpoint}` },
        (err, httpResponse, body: string) => {
          if (err) {
            reject(err);
          }
          if (httpResponse.statusCode >= 400) {
            reject(Error(`Server responded with status code ${httpResponse.statusCode}:\n${body}`));
          }
          if (checker.call(thisArg, body)) {
            clearInterval(checkInterval);
            resolve();
          }
        });
    }, interval);
  });
}
