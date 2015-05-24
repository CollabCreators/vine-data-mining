"use strict";
import VineApi from "./api/VineApi";
import {VineHelper} from "./api/ApiHelpers";
let Orchestrate = require("orchestrate");

let username: string = process.env.VINE_USERNAME;
let password: string = process.env.VINE_PASSWORD;
let orchestrateKey: string = process.env.ORCHESTRATE_KEY;
let db = Orchestrate(orchestrateKey);

function startVine() {
  let vine = new VineApi();

  vine.getUserProfile("911422956889063424")
    .then((data: UserProfileData) => {
    console.log(data);
  })
    .catch(error => {throw error});
}

startVine();
