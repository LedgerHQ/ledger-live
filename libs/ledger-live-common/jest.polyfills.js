const { Buffer } = require("./node_modules/buffer");

// NOTE: Buffer polyfill (needed for celo), needs to be overridable (for cardano)
Object.defineProperties(globalThis, {
  Buffer: { value: Buffer, configurable: true, writable: true },
});

// Polyfill for 'self' (needed for tronweb in Node.js environment)
if (typeof globalThis.self === "undefined") {
  globalThis.self = globalThis;
}

// Polyfill for libsodium-wrappers (needed for cosmos-related packages)
if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}
