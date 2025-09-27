/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { TextDecoder, TextEncoder } = require("node:util");
const { ReadableStream } = require("node:stream/web");

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
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
  fetch: { value: fetch, writable: true },
  Blob: { value: Blob },
  File: { value: File },
  Headers: { value: Headers },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response },
});
