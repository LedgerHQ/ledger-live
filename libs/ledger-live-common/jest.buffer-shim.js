/* eslint-disable @typescript-eslint/no-var-requires */
// Jest maps `require("buffer")` here so that bitcoinjs-lib / varuint-bitcoin share the
// same userland Buffer as the one installed on `global` by jest.polyfills.js (avoids
// "buffer must be a Buffer instance").
//
// Since jest 30.5 the `^buffer$` mapper also captures `node:buffer`, so this file cannot
// require the builtin to re-export what the userland polyfill lacks — that require would
// resolve back here. `Blob`/`File`/`atob`/`btoa` are read off the Node globals, which the
// mapper does not touch; `constants` and `kStringMaxLength` are captured in jest.config.ts
// (real Node) and handed over through the environment. See jestjs/jest#16415.
const polyfill = require("buffer/");
const { constants, kStringMaxLength } = JSON.parse(process.env.__NODE_BUFFER_EXTRAS || "{}");

module.exports = {
  ...polyfill,
  constants,
  kStringMaxLength,
  Blob: globalThis.Blob,
  File: globalThis.File,
  atob: globalThis.atob,
  btoa: globalThis.btoa,
};
