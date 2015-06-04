/// <reference path="../../typings/tsd.d.ts"/>

"use strict";
import * as request from "request";
import {Promise} from "es6-promise";
import {UserProfileHelper, VineHelper} from "./ApiHelpers";

export default class VineApi {

  private static BASE_URL = "https://api.vineapp.com";
  private static DEFAULT_HEADERS: request.Headers = {
    "User-Agent": "com.vine.iphone/1.0.3 (unknown, iPhone OS 8.3.0, iPhone, Scale/2.000000)",
    "Accept": "*/*",
    "Accept-Language": "en, sv, fr, de, ja, nl, it, es, pt, pt-PT, da, fi, nb, ko, zh-Hans, zh-Hant, " +
    "ru, pl, tr, uk, ar, hr, cs, el, he, ro, sk, th, id, ms, en-GB, ca, hu, vi, en-us;q=0.8",
    "Accept-Encoding": "gzip"
  };
  private sessionKey: string;

  constructor(username?: string, password?: string) {
    // Check if username and password is in valid format.
    if (typeof username != "string" || username.length === 0 || typeof password != "string" || password.length === 0) {
      this.sessionKey = "";
      return;
    }
    this.login(username, password)
      .then((data: AuthenticateData) => {
      this.sessionKey = data.key;
    })
      .catch((err) => {
      throw err;
    });
  }

  private static HeadersFactory(sessionKey?: string): request.Headers {
    let obj = VineApi.DEFAULT_HEADERS;
    if (sessionKey) {
      obj["vine-session-id"] = sessionKey;
    }
    return obj;
  }

  /**
   * Login user with given credentials.
   * @param {string} username User's username or email.
   * @param {string} password User's password.
   * @return {Promise<ApiResponse>} A promise resolving to API's `ApiResponse`,
   *                                           or rejecting with `Error`.
   */
  public login(username: string, password: string): Promise<AuthenticateData> {
    return new Promise<AuthenticateData>((resolve, reject) => {
      // Perform post to API authenticate endpoint using given credentials.
      request.post({
        uri: `${VineApi.BASE_URL}/users/authenticate`,
        headers: VineApi.HeadersFactory(),
        form: {
          username: username,
          password: password
        },
        gzip: true
      },
        (err, httpResponse, body) => {
          // Error occured during request, reject promise with api message and `err`.
          if (err) {
            reject(Error(`Vine - Login: ${err}`));
          }
          // Parse response's body.
          let response: ApiResponse<AuthenticateData> = JSON.parse(body);
          // Reject promise if API didn't return a successful response.
          if (!response.success) {
            reject(Error(`Vine - Login: ${response.error}`));
          }
          // Everything is ok, resolve promise with parsed response.
          resolve(response.data);
        });
    });
  }

  /**
   * Log out currently logged in user or reject promise if no session.
   *
   * @returns {Promise}
   */
  public logout(): Promise<ApiResponse<AuthenticateData>> {
    if (!this.sessionKey) {
      return Promise.reject(Error("Not logged in."));
    }
    return new Promise<ApiResponse<AuthenticateData>>((resolve, reject) => {
      request.del({
        url: `${VineApi.BASE_URL}/users/authenticate`,
        headers: VineApi.HeadersFactory(this.sessionKey),
        gzip: true
      },
        (err, httpResponse, body) => {
          // Error occured during request, reject promise with api message and `err`.
          if (err) {
            reject(Error(`Vine - Logout: ${err}`));
          }
          // Parse response's body and resolve promise with the object.
          resolve(JSON.parse(body));
        });
    });
  }

  /**
   * Get user's profile data.
   *
   * @param   {string}                   userId Id of user.
   *
   * @returns {Promise<UserProfileData>}        API response with fitlered out uninteresting data.
   */
  public getUserProfile(userId: string): Promise<UserProfileData> {
    return new Promise((resolve, reject) => {
      // Make a request to /users/profiles with given userId.
      this.makeApiRequest("users/profiles", userId)
        .then((data: ApiResponse<UserData>) => {
        // When the API request promise resolves, process returned data and use it to resolve promise.
        resolve(UserProfileHelper.ProcessApiResponse(userId, data.data));
      })
      // If  there happened to be an error, reject this promise.
        .catch(error => reject(error));
    });
  }

  /**
   * Get full user timeline for given userId.
   *
   * @param   {string}                  userId Id of user.
   *
   * @returns {Promise<Array<VineData>>}        Promise resolving with array of all user's videos.
   */
  public getUserTimeline(userId: string): Promise<Array<VineData>> {
    return new Promise((resolve, reject) => {
      // Make a request to /timelines/users with given userId.
      this.makePaginatedApiRequest("timelines/users", userId)
        .then((data: PaginatedResponse<VideoRecord>) => {
        // When the API request promise resolves, process returned data array and use it to resolve promise.
        resolve(data.records.map((d: VideoRecord) => VineHelper.ProcessApiResponse(userId, d)));
      })
      // If  there happened to be an error, reject this promise.
        .catch(error => reject(error));
    });
  }

  /**
   * Make a request to given Vine API endpoint.
   *
   * @param   {string}            endpoint  Vine API endpoint.
   * @param   {string}            reqData   Request data, e.g. userId.
   * @param   {Array<Object>}     reqParams Additional parameters, e.g. size or page.
   *
   * @returns { Promise<ApiResponse<any>>}  Promise resolving to full generic ApiResponse.
   */
  private makeApiRequest(endpoint: string, reqData: string, reqParams?: Array<Object>): Promise<ApiResponse<any>> {
    // Set url paramteres to empty string as a fallback if there is no `reqParams`.
    let params = "";
    if (reqParams && reqParams.length > 0) {
      // If there is at least one `reqParams`, map all params to match `key=value` pairs,
      //  join them with `&` and prepend `?`. End result should be something like: ?size=100&page=2.
      params = "?" + reqParams.map((p) => {
        let key = Object.keys(p)[0];
        return `${key}=${p[key]}`;
      }).join("&");
    }
    return new Promise((resolve, reject) => {
      // Make a get request to Vine API's `endpoint` using `reqData` and parsed `params`.
      request.get({
        url: `${VineApi.BASE_URL}/${endpoint}/${reqData}${params}`,
        // Add headers to simulate a request from iPhone.
        headers: VineApi.HeadersFactory(this.sessionKey),
        gzip: true
      },
        (err, httpResponse, body: string) => {
          // If there was error with request, reject promise with `err`.
          if (err) {
            reject(Error(err));
          }
          // Try to parse response JSON string.
          let data: ApiResponse<any>;
          try {
            data = JSON.parse(body);
          }
          catch (e) {
            // If parsing failed, reject promise.
            reject(e);
          }
          // If response wasn't successful, reject promise with reponse error.
          if (!data || !data.success) {
            reject(Error(data.error));
          }
          // There was no error, resolve promise with parsed data.
          resolve(data);
        });
    });
  }

  /**
   * Make a request to paginated API endpoint.
   * Returned promise will not resolve until data from all pages is collected.
   *
   * @param   {string}                  endpoint Vine API endpoint (which returns paginated response).
   * @param   {string}                  reqData  Request data, e.g. userId.
   *
   * @returns {Promise<PaginatedResponse<any>>}  Promise resolving to PaginatedResponse with all pages data.
   */
  private makePaginatedApiRequest(endpoint: string, reqData: string): Promise<PaginatedResponse<any>> {
    return new Promise((resolve, reject) => {
      // Make a request to first page (page=1 is implicit).
      // Using a very large value for size to max out API's max allowed page size.
      this.makeApiRequest(endpoint, reqData, [{ size: 1000 }])
        .then((data) => {
        // Set temporary variable to store response `data` field.
        let responseData: PaginatedResponse<any> = data.data;
        // Store max size of a single page. This should max out at 100, but keeping it dynamic.
        let maxSize = responseData.size;
        // Initialize an array of secondary, i.e. pages following the first, requests promises.
        let secondaryRequests: Array<Promise<any>> = [];
        // Loop through pages 2 - end, end is calculated using pages size / max size of single page.
        for (let page = 2, totalPages = Math.ceil(responseData.count / maxSize); page <= totalPages; page++) {
          // Make a request to current `page`, save promise to temporary variable.
          let secondaryReqPromise = this.makeApiRequest(endpoint, reqData, [{ size: maxSize }, { page: page }])
          // Append data to `responseData` when request promise resolves.
            .then((d: ApiResponse<PaginatedResponse<any>>) => {
            d.data.records.forEach(e => responseData.records.push(e));
          });
          // Add request promise to array of secondary promises.
          secondaryRequests.push(secondaryReqPromise);
        }
        // Wait for all promises to resolve, resolve returned promise when they do.
        Promise.all(secondaryRequests).then(() => resolve(responseData));
      })
      // If  there happened to be an error, reject this promise.
        .catch(error => reject(error));
    });
  }
}
