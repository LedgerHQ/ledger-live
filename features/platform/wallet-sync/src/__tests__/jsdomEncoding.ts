import { TextDecoder, TextEncoder } from "node:util";

// jsdom has no Encoding API; the key ring crypto reads it when its module loads, so import this
// file before any key ring import.
Object.assign(globalThis, { TextEncoder, TextDecoder });
