/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { TextDecoder, TextEncoder } = require("node:util");
const { ReadableStream, TransformStream } = require("node:stream/web");
const { MessageChannel, MessagePort } = require("node:worker_threads");

const { setTimeout, clearTimeout, setInterval, clearInterval } = globalThis;

const wrapTimer = timerId => {
  if (timerId && typeof timerId === "object") {
    if (typeof timerId.unref !== "function") {
      Object.defineProperties(timerId, {
        unref: { value: () => timerId },
        ref: { value: () => timerId },
      });
    }
    return timerId;
  }

  return {
    id: timerId,
    unref: () => {},
    ref: () => {},
  };
};

const unwrapTimer = timer =>
  timer && typeof timer === "object" && "id" in timer ? timer.id : timer;

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
  setTimeout: { value: (...args) => wrapTimer(setTimeout(...args)) },
  clearTimeout: { value: timer => clearTimeout(unwrapTimer(timer)) },
  setInterval: { value: (...args) => wrapTimer(setInterval(...args)) },
  clearInterval: { value: timer => clearInterval(unwrapTimer(timer)) },
  MessageChannel: { value: MessageChannel },
  MessagePort: { value: MessagePort },
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
