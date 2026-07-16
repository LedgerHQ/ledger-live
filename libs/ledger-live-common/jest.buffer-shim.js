/* eslint-disable @typescript-eslint/no-var-requires */
// Jest maps `require("buffer")` here so that bitcoinjs-lib / varuint-bitcoin share the
// same userland Buffer as the one installed on `global` by jest.polyfills.js (avoids
// "buffer must be a Buffer instance"). The userland polyfill lacks `constants`, which
// pino/thread-stream (via @hashgraph/sdk) read as `buffer.constants.MAX_STRING_LENGTH`,
// so we re-attach the Node builtin's constants. `node:buffer` is unaffected by the
// `^buffer$` mapper, so requiring it here stays on the real builtin.
const polyfill = require("buffer/");
const { constants } = require("node:buffer");

module.exports = { ...polyfill, constants };
