// Web (jsdom) setup shared across features/flow packages.

// jsdom doesn't implement the Encoding API, unlike every runtime this code ships to
// (browsers, React Native, Node). Packages reading TextEncoder at module-eval time
// (e.g. @ledgerhq/device-contacts-kit) throw on import without it.
const { TextEncoder, TextDecoder } = require("node:util");

global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;

// Mock window.matchMedia for components that read it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
