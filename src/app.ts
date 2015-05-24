"use strict";
import VineApi from "./api/VineApi";

let username: string = process.env.VINE_USERNAME;
let password: string = process.env.VINE_PASSWORD;

let vine = new Vine(username, password);
