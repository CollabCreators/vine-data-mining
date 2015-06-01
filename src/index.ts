"use strict";

// Import constructors.
import Router from "./router/index";
import Master from "./master/index";
import Worker from "./worker/index";
import {exec} from "child_process";
import * as path from "path";
import * as fs from "fs";

/**
 * File containing definitions for environment variables.
 *
 * @type {String}
 */
const ENV_PATH = "./bin/env.json";

// Try to read file with environment variables and add them to `process.env`.
// If any of this fails, execution will continue without logging any errors.
try {
  let configFile = JSON.parse(fs.readFileSync(path.resolve(ENV_PATH)).toString());
  for (let key in configFile) {
    process.env[key] = configFile[key];
    console.log(`Added environemnt variable ${key}`);
  }
}
catch (e) { }

// Set environemnt variable NODE_TLS_REJECT_UNAUTHORIZED (to allow connection to gresak.io) router.
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

/**
 * Port where the application will run.
 * NOTE: If changing this value, make sure to also change it at ROUTER_SERVER in helpers/communicator.ts.
 *
 * @type {Number}
 */
const PORT = 9631;

/**
 * Arguments that will print a help message.
 *
 * @type {Array}
 */
const HELP_ARGS = ["-h", "--help", "help"];

/**
 * Kill applications on `PORT`.
 * (NOTE: Works on Linux / OS X only)
 *
 * @param   {Function} cb Function to call when exec is done.
 */
function killPort(cb) {
  exec(`lsof -i | grep :${PORT} | awk '{print $2}' | xargs kill`, cb);
}

/**
 * Key(arg) - value(constructor) map for argument and it's corresponding constructor.
 *
 * @type {Object}
 */
const initFunctions = {
  // Router and master require `PORT` to be free, but worker does not,
  // therefore killing other applications is not necessary.
  "router": () => killPort(() => new Router(PORT)),
  "master": () => killPort(() => new Master(PORT)),
  "worker": () => new Worker(PORT)
}

// Get argument or use default value empty string.
let runArg = (process.argv[2] || "").toLowerCase();

// If run argument is a falsy value, print error message and exit.
if (!runArg) {
  console.error("Missing run argument!");
  process.exit(1);
}

// If run argument matches one of `HELP_ARGS`, output a help message and exit.
if (HELP_ARGS.indexOf(runArg) >= 0) {
  console.log(`Usage '${process.argv[1]}' [run argument]
    \thelp   - display this help message
    \tmaster - run master node server on port ${PORT}
    \trouter - run router server on port ${PORT}
    \tworker - run a worker
    `);
  process.exit(0);
}

// If run argument isn't a help message and it doesn't match any of `CONSTRUCTORS`, print error message and exit.
if (Object.keys(initFunctions).indexOf(runArg) === -1) {
  console.error("Unsupported run argument!");
  process.exit(1);
}

// Call a constructor based on runArgs and pass it the `PORT`.
initFunctions[runArg]();
