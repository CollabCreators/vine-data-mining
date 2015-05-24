import * as express from "express";
import expressInit from "../helpers/expressInit";
import VineApi from "../api/VineApi";
import Job from "./job";
let Orchestrate = require("orchestrate");

class MasterNode {

  /**
   * Id's of 5 most followed users (my assuption).
   * @type {Array<string>}
   */
  private static INITIAL_USERS = [
    "934940633704046592", // KingBach
    "935302706900402176", // Nash Grier
    "912665006900916224", // Brittany Furlan
    "912482556656623616", // Rudy Mancuso
    "925163818496167936"  // Curtis Lepore
  ];

  private db: any;
  private jobs: Array<Job>;

  constructor(port: number) {
    if (!process.env.ORCHESTRATE_KEY) {
      throw Error("Missing environment variable ORCHESTRATE_KEY.");
    }
    this.db = Orchestrate(process.env.ORCHESTRATE_KEY);
    expressInit(port, "/master", this.setupExpressRouter, this);
  }

  private setupExpressRouter(): express.Router {
    let router = express.Router();
    router.get("/", (req, res) => { res.json({}) });
    return router;
  }
}
