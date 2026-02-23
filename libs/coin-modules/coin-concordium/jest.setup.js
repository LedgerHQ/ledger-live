// Polyfill browser globals for WASM modules in concordium-sdk-adapter
// The Concordium SDK's bundled WASM code expects browser globals
globalThis.self = globalThis;
globalThis.document = {
  baseURI: "http://localhost",
};
globalThis.location = {
  href: "http://localhost/",
};
