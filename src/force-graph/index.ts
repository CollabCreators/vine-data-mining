import * as express from "express";
import {resolve} from "path";

export default class ForceGraphServer {

  private static PORT = 3000;

  constructor() {
    let app = express();
    let rootPath = resolve(__dirname, "../../../src/force-graph");
    app.use("/", express.static(rootPath));
    app.listen(ForceGraphServer.PORT);
    console.log("serving from", rootPath);
    console.log("graph server listening at", ForceGraphServer.PORT);
  }

}
