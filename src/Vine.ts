/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="./VineAPI.d.ts"/>

"use strict";
import * as request from "request";
import {Promise} from "es6-promise";

export default class Vine {

    private static BASE_URL = "https://api.vineapp.com";
    private static DEFAULT_HEADERS: request.Headers = {
        "User-Agent": "com.vine.iphone/1.0.3 (unknown, iPhone OS 6.1.0, iPhone, Scale/2.000000)",
        "accept-language": "en, sv, fr, de, ja, nl, it, es, pt, pt-PT, da, fi, nb, ko, zh-Hans, zh-Hant, " +
        "ru, pl, tr, uk, ar, hr, cs, el, he, ro, sk, th, id, ms, en-GB, ca, hu, vi, en-us;q=0.8"
    };
    private sessionKey: string;

    constructor(username: string, password: string) {
        // Check if username and password is in valid format.
        if (username.length === 0) {
            throw Error("Vine - Constructor: Username is an empty string.");
        }
        if (password.length === 0) {
            throw Error("Vine - Constructor: Password is an empty string.");
        }
        this.login(username, password)
            .then((data: AuthenticateData) => {
                console.log(data);
                this.sessionKey = data.key;
        })
            .catch((err) => {
                console.log("login error")
                console.log(err)
                throw err;
        });
    }

    private static HeadersFactory(sessionKey?: string): request.Headers {
        let obj = Vine.DEFAULT_HEADERS;
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
                uri: `${Vine.BASE_URL}/users/authenticate`,
                headers: Vine.HeadersFactory(),
                form: {
                    username: username,
                    password: password
                }
            },
                (err, httpResponse, body) => {
                    console.log('body', err)
                    // Error occured during request, reject promise with api message and `err`.
                    if (err) {
                        reject(Error(`Vine - Login: ${err}`));
                    }
                    // Parse response's body.
                    let response: ApiResponse = JSON.parse(body);
                    // Reject promise if API didn't return a successful response.
                    if (!response.success) {
                        reject(Error(`Vine - Login: ${response.error}`));
                    }
                    // Everything is ok, resolve promise with parsed response.
                    resolve(response.data);
                });
        });
    }

    public logout(): Promise<ApiResponse> {
        return new Promise<ApiResponse>((resolve, reject) => {
            request.del({
                url: `${Vine.BASE_URL}/users/authenticate`,
                headers: Vine.HeadersFactory(this.sessionKey)
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

    public searchUser(username: string): Promise<UserSearchData> {
        console.log("search", username)
        return new Promise<UserSearchData>((resolve, reject) => {
            request.get(`${Vine.BASE_URL}/users/search/${username}`, {
                headers: Vine.HeadersFactory(this.sessionKey)
            },
                (err, httpResponse, body) => {
                    console.log('done', body)
                    // Error occured during request, reject promise with api message and `err`.
                    if (err) {
                        reject(Error(`Vine - Search_User: ${err}`));
                    }
                    // Parse response's body.
                    let response: ApiResponse = JSON.parse(body);
                    // Reject promise if API didn't return a successful response.
                    if (!response.success) {
                        reject(Error(`Vine - Search_User: ${response.error}`));
                    }
                    // Everything is ok, resolve promise with parsed response.
                    resolve(response.data);
                });
            console.log("end request")
        });
    }
}
