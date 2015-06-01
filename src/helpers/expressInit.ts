import * as express from "express";
import * as bodyParser from "body-parser";
import * as https from "https";

export interface SSLConfig {
  /**
   * Private key file.
   *
   * @type {string}
   */
  key: string;

  /**
   * Certificate file.
   *
   * @type {string}
   */
  cert: string;
}

/**
 * Initialize new express app.
 *
 * @param   {number}          port       Port on which to run the app.
 * @param   {string}          routerPath Path that router will listen on.
 * @param   {Function}        initRouter Function used to init router. Must return the router.
 * @param   {any}             thisArg    (optional) What this argument to use when calling initRouter.
 *
 * @returns {express.Express}            Initialized express app.
 */
export function expressInit(port: number, routerPath: string, initRouter: () => express.Router, thisArg: any = this, conf: SSLConfig = undefined): express.Express {
  let app = express();
  // NOTE: In `limit` value, `mb` must be lowercase!
  app.use(bodyParser.json({
    limit: "50mb",
    parameterLimit: 50000
  }));
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 50000
  }));
  app.use(routerPath, initRouter.call(thisArg));
  if (conf && typeof conf.key === "string" && typeof conf.cert === "string") {
    // Create a https server with passed `conf` an listen on `port`.
    https.createServer(conf, app).listen(port);
  }
  else {
    // Config not passed, assuming https is not required, use regular http.
    app.listen(port);
  }
  console.log(`Router listening on ${port}`);
  return app;
}
