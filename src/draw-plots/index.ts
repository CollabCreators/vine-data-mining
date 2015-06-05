import LocalStorage from "../simple-worker/local-storage";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
let Plotly = require("plotly");

export default class DrawPlots {

  private static FIGURE_PATH = path.resolve(__dirname, "../../../report/figures/");

  private plotly;
  private localStorage: LocalStorage;
  private users: Array<VinesUsers>;

  constructor() {
    // Check if PLOTLY_KEY environment variable is set.
    if (!process.env.PLOTLY_KEY) {
      throw Error("Missing environment variable PLOTLY_KEY.");
    }
    mkdirp.sync(DrawPlots.FIGURE_PATH);
    // Initialize plotly connector.
    this.plotly = Plotly("markogresak", process.env.PLOTLY_KEY);
  }

}
