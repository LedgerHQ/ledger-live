const { Buffer } = require("./node_modules/buffer");

// NOTE: Buffer polyfill (needed for celo), needs to be overridable (for cardano)
Object.defineProperties(globalThis, {
  Buffer: { value: Buffer, configurable: true, writable: true },
});
