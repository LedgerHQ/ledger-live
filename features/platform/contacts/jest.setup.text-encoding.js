// jsdom (used for the "web" jest project) doesn't implement the Encoding API,
// unlike every real runtime this code ships to (browsers, React Native, Node).
// @ledgerhq/device-contacts-kit uses TextEncoder at module-eval time, so
// anything that imports it (even transitively) needs this polyfilled first.
const { TextEncoder, TextDecoder } = require("node:util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
