const { Buffer } = require("./node_modules/buffer");

Object.defineProperties(globalThis, {
  Buffer: { value: Buffer },
});
