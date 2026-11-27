require("@testing-library/jest-dom");

// jsdom has no Encoding API, which the key ring's device crypto reads on import.
const { TextEncoder, TextDecoder } = require("node:util");

global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;
