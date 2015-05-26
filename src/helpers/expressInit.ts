import * as express from "express";
import * as bodyParser from "body-parser";
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
export default function expressInit(port: number, routerPath: string, initRouter: () => express.Router, thisArg: any = this): express.Express {
  let app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(routerPath, initRouter.call(thisArg));
  app.listen(port);
  console.log(`Router listening on ${port}`);
  return app;
}
