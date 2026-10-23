// Web (jsdom) setup shared across features/flow packages.

// jsdom doesn't implement the Encoding API, unlike every runtime this code ships to
// (browsers, React Native, Node). Packages reading TextEncoder at module-eval time
// (e.g. @ledgerhq/device-contacts-kit) throw on import without it.
const { TextEncoder, TextDecoder } = require("node:util");

global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;

// jsdom ships no fetch, so MSW's interceptors throw on `Response` the moment a test imports them.
// Same primitives the apps polyfill (see apps/ledger-live-desktop/jest.polyfills.js).
// The streams have to land on the global before undici loads: it reads them at module eval.
// These have to land before undici loads: it reads them at module eval.
const { ReadableStream, TransformStream } = require("node:stream/web");
const { BroadcastChannel, MessageChannel, MessagePort } = require("node:worker_threads");

global.ReadableStream ??= ReadableStream;
global.TransformStream ??= TransformStream;
global.BroadcastChannel ??= BroadcastChannel;
global.MessageChannel ??= MessageChannel;
global.MessagePort ??= MessagePort;

// The fetch primitives come as one set: MSW reads a `Request` and answers a `Response`, so two
// implementations meeting would fail the `instanceof` checks on either side.
if (!global.Response) {
  const { fetch, Headers, FormData, Request, Response } = require("undici");

  Object.assign(global, { fetch, Headers, FormData, Request, Response });
}

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
