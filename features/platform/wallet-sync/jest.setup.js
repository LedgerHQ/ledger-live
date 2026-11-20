const { TextDecoder, TextEncoder } = require("node:util");

// jsdom lacks the Encoding API, which the LKRP crypto reads as it loads.
Object.assign(globalThis, { TextDecoder, TextEncoder });
