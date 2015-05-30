"use strict";
import VineApi from "./api/VineApi";
import {VineHelper} from "./api/ApiHelpers";
import Communicator from "./helpers/communicator";
import {JobTypes} from "./api/ApiHelpers";
let Orchestrate = require("orchestrate");

let username: string = process.env.VINE_USERNAME;
let password: string = process.env.VINE_PASSWORD;
let orchestrateKey: string = process.env.ORCHESTRATE_KEY;
let db = Orchestrate(orchestrateKey);

function startVine() {
  let vine = new VineApi();
  console.time("get timeline");
  vine.getUserTimeline("911422956889063424")
    .then((data: Array<VineData>) => {
    console.log("data size", data.length);
    console.timeEnd("get timeline");
    console.time("get mentions");
    let mentions = VineHelper.GetUniqueMentions(data);
    console.log("mentions size", mentions.length);
    let mentionedUsers: Array<UserProfileData> = [];
    Promise.all(mentions.map((m) => {
      return vine.getUserProfile(m).then(d => mentionedUsers.push(d)).catch(error => console.log(error));
    })).then(() => {
      let sortedUsers = mentionedUsers.sort((a, b) => b.followerCount - a.followerCount);
      console.log("users len:", mentionedUsers.length);
       let promises = sortedUsers.slice(0, 5).map((e) => {
        return promises.push(db.put("vine", e.id, e));
      });
      Promise.all(promises).then(() => {
        console.timeEnd("get mentions");
      });
    });
  })
    .catch(error => console.error(error));
}

function startRegister() {
  Communicator.registerAddress("http://localhost:9631", "router", "1.2.3.4").then(() => {
    console.log("registered successfully");
  }).catch((err) => console.error(err))
}

// startRegister();

console.log(typeof JobTypes.User);


// startVine();
