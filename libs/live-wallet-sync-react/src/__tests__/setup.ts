// Essential setup for React component testing with jsdom
import "@testing-library/jest-dom";

// Polyfill TextEncoder/TextDecoder only if missing (Node 18+ has them)
if (!globalThis.TextEncoder) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require("util");
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
