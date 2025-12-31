/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { TextDecoder, TextEncoder } = require("node:util");
const { ReadableStream, TransformStream } = require("node:stream/web");

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
  BroadcastChannel: {
    value: class {
      postMessage() {}
      close() {}
      onmessage = null;
      onmessageerror = null;
    },
  },
});

const { Blob, File } = require("node:buffer");

const performanceMock = {
  markResourceTiming: () => {},
  clearResourceTimings: () => {},
  getEntriesByType: () => [],
  getEntriesByName: () => [],
  getEntries: () => [],
  mark: () => {},
  measure: () => {},
  clearMarks: () => {},
  clearMeasures: () => {},
  now: () => Date.now(),
  timeOrigin: Date.now(),
  toJSON: () => ({}),
};

Object.defineProperty(globalThis, "performance", {
  value: performanceMock,
  writable: true,
  configurable: true,
});

const { fetch, Headers, FormData, Request, Response } = require("undici");

Object.defineProperties(globalThis, {
  fetch: { value: fetch, writable: true, configurable: true },
  Blob: { value: Blob, writable: true, configurable: true },
  File: { value: File, writable: true, configurable: true },
  Headers: { value: Headers, writable: true, configurable: true },
  FormData: { value: FormData, writable: true, configurable: true },
  Request: { value: Request, writable: true, configurable: true },
  Response: { value: Response, writable: true, configurable: true },
});
