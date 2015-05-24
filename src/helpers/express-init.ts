import * as express from "express";
import * as bodyParser from "body-parser";

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
export function expressInit(port: number, routerPath: string, initRouter: () => express.Router, thisArg?: any): express.Express {
  let app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(routerPath, initRouter.call(thisArg || this));
  app.listen(port);
  console.log(`Router listening on ${port}`);
  return app;
}
