import * as express from "express";
import {expressInit} from "../helpers/express-init";

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
    router.get('/', (req, res) => {res.json(this.getAddress())});
    router.put('/:address', (req, res) => {res.json(this.putAddress(req.body.address || req.params.address))});
    router.delete('/', (req, res) => {res.json(this.delAddress())});
    return router;
  }

  /**
   * Get curretly stored address.
   *
   * @returns {Object} IP address in form { address: xxx.xxx.xxx.xxx }.
   */
  private getAddress(): Object {
    return { address: this.address };
  }

  /**
   * Add (overwrite) stored address.
   *
   * @param   {string} address New IP address.
   *
   * @returns {Object}         Return value from getAddress (new address).
   */
  private putAddress(address: string) {
    this.address = address || null;
    return this.getAddress();
  }

  /**
   * Remove stored address.
   *
   * @returns {Object} Return value from getAddress -> {address: null}.
   */
  private delAddress() {
    this.address = null;
    return this.getAddress();
  }

}

// Start a new router on port 9631.
new Router(9631);
