import * as express from "express";
import {SSLConfig, expressInit} from "../helpers/expressInit";

class Router {

  private address: string;

  /**
   * Start a new express server on given port.
   *
   * @param   {number} port Port to listen on.
   */
  constructor(port: number) {
    this.address = null;
    expressInit(port, "/router", this.setupExpressRouter, this);
  }

  /**
   * Setup express router. Adds methods:
   * 	- get: get currently stored address
   * 	- put: add (overwrite) address, returns address
   * 	- delete: delete stored address, returns address (null)
   *
   * @returns {express.Router} Configured express router.
   */
  private setupExpressRouter(): express.Router {
    let router = express.Router();
    // Set GET to return JSON result of `getAddress()`.
    router.get("/", (req, res) => { res.json(this.getAddress(req)) });
    // Set PUT to add `:address` (in body or as param) and return JSON result of `getAddress()`.
    router.put("/:address", (req, res) => { res.json(this.putAddress(req)) });
    // Set DELETE delete stored address and return JSON result of `getAddress()`.
    router.delete("/", (req, res) => { res.json(this.delAddress(req)) });
    return router;
  }

  /**
   * Get curretly stored address.
   *
   * @param   {any=}  req (optional) Express request object, it will be used to log client IP.
   *
   * @returns {Object}               IP address in form { address: xxx.xxx.xxx.xxx }.
   */
  private getAddress(req?: any): Object {
    if (req) {
      console.log(`${req.method} request from`, (req.headers["x-forwarded-for"] || req.connection.remoteAddress));
    }
    return { address: this.address };
  }

  /**
   * Add (overwrite) stored address.
   *
   * @param   {any} req        Express request object.
   *
   * @returns {Object}         Return value from getAddress (new address).
   */
  private putAddress(req: any) {
    this.address = (req.body.address || req.params.address) || null;
    return this.getAddress(req);
  }

  /**
   * Remove stored address.
   *
   * @param {any} req  Express request object.
   *
   * @returns {Object} Return value from getAddress -> {address: null}.
   */
  private delAddress(req?: any) {
    this.address = null;
    return this.getAddress(req);
  }

}

// Start a new router on port 9631.
new Router(9631);
