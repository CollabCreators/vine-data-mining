/// <reference path="../../typings/tsd.d.ts"/>
/// <reference path="./api-declarations/VineAPI.d.ts"/>
/// <reference path="./StoredData.d.ts"/>

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
        }
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

  public logout(): Promise<ApiResponse<AuthenticateData>> {
    return new Promise<ApiResponse<AuthenticateData>>((resolve, reject) => {
      request.del({
        url: `${VineApi.BASE_URL}/users/authenticate`,
        headers: VineApi.HeadersFactory(this.sessionKey)
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

  public getUserProfile(userId: number): Promise<UserProfileData> {
    return new Promise((resolve, reject) => {
      this.makeApiRequest("users/profiles", userId.toString())
        .then((body: ApiResponse<UserData>) => {
        resolve(UserProfileHelper.ProcessApiResponse(body.data));
      })
        .catch(error => reject(error));
    });
  }

  public getUserTimeline(userId: number): Promise<Array<VineData>> {
    return new Promise((resolve, reject) => {
      this.makePaginatedApiRequest("timelines/users", userId.toString())
        .then((body: PaginatedResponse<VideoRecord>) => {
        resolve(body.records.map((d: VideoRecord) => VineHelper.ProcessApiResponse(userId, d)));
      })
        .catch(error => reject(error));
    });
  }

  private makeApiRequest(endpoint: string, reqData: string, reqParams?: Array<Object>): Promise<ApiResponse<any>> {
    let params = "";
    if (reqParams && reqParams.length > 0) {
      params = "?" + reqParams.map((p) => {
        let key = Object.keys(p)[0];
        return `${key}=${p[key]}`;
      }).join("&");
    }
    return new Promise((resolve, reject) => {
      request.get({
        url: `${VineApi.BASE_URL}/${endpoint}/${reqData}${params}`,
        headers: VineApi.HeadersFactory(this.sessionKey)
      },
        (err, httpResponse, body: ApiResponse<any>) => {
          if (err) {
            reject(Error(err));
          }
          if (!body.success) {
            reject(Error(body.error));
          }
          resolve(body);
        });
    });
  }

  private makePaginatedApiRequest(endpoint: string, reqData: string): Promise<PaginatedResponse<any>> {
    return new Promise((resolve, reject) => {
      this.makeApiRequest(endpoint, reqData, [{ size: 100 }])
        .then((data) => {
        let responseData: PaginatedResponse<any> = data.data;
        let secondaryRequests: Array<Promise<any>>;
        for (let page = 2, totalPages = Math.floor(responseData.count / 100) + 1; page <= totalPages; page++) {
          let secondaryReqPromise = this.makeApiRequest(endpoint, reqData, [{ size: 100 }, { page: page }])
            .then((d: ApiResponse<PaginatedResponse<any>>) => {
            d.data.records.forEach(e => responseData.records.push(e));
          });
          secondaryRequests.push(secondaryReqPromise);
        }
        Promise.all(secondaryRequests)
          .then(() => {
          resolve(responseData);
        });
      })
        .catch(error => reject(error));
    });
  }
}
