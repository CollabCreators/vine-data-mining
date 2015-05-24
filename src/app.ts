"use strict";
import VineApi from "./api/VineApi";

let username: string = process.env.VINE_USERNAME;
let password: string = process.env.VINE_PASSWORD;

function startVine() {
  let vine = new VineApi();

  vine.getUserProfile("911422956889063424")
    .then((data: UserProfileData) => {
    console.log(data);
  })
    .catch(error => {throw error});
}

startVine();
