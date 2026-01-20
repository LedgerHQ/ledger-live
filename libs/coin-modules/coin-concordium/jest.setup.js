// Polyfill browser globals for WASM modules in concordium-sdk-adapter
// The Concordium SDK's bundled WASM code expects browser globals
global.self = global;
global.document = {
  baseURI: "http://localhost/",
};
global.location = {
  href: "http://localhost/",
};
