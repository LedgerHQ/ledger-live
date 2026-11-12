// Userland Buffer shared with bitcoinjs-lib, plus the builtin `constants` pino/thread-stream need.
const polyfill = require("buffer/");
const { constants } = require("node:buffer");

module.exports = { ...polyfill, constants };
