"use strict";

// Import constructors.
import Router from "./router/index";
import Master from "./master/index";
import Worker from "./worker/index";

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
 * Key(arg) - value(constructor) map for argument and it's corresponding constructor.
 *
 * @type {Object}
 */
const CONSTRUCTORS = {
  "router": Router,
  "master": Master,
  "worker": Worker
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
if (Object.keys(CONSTRUCTORS).indexOf(runArg) === -1) {
  console.error("Unsupported run argument!");
  process.exit(1);
}

// Instantiate a new service based on runArgs and pass it the `PORT`.
new CONSTRUCTORS[runArg](PORT);
