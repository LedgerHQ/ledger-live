/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { Buffer } = require("./node_modules/buffer");

// Set Buffer first so undici (and others) can use Buffer.alloc when they load
Object.defineProperty(global, "Buffer", {
  value: Buffer,
  writable: true,
  configurable: true,
});

const { TextDecoder, TextEncoder } = require("node:util");
const { ReadableStream, TransformStream } = require("node:stream/web");
const { MessageChannel, MessagePort } = require("node:worker_threads");

// writable + configurable so they can override read-only globals (e.g. jsdom Window)
Object.defineProperties(global, {
  TextDecoder: { value: TextDecoder, writable: true, configurable: true },
  TextEncoder: { value: TextEncoder, writable: true, configurable: true },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
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
const { fetch, Headers, FormData, Request, Response } = require("undici");

const { setTimeout, clearTimeout, setInterval, clearInterval } = global;

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

// NOTE: Timer wrappers (Buffer already set above for undici)
Object.defineProperties(global, {
  setTimeout: { value: (...args) => wrapTimer(setTimeout(...args)) },
  clearTimeout: { value: timer => clearTimeout(unwrapTimer(timer)) },
  setInterval: { value: (...args) => wrapTimer(setInterval(...args)) },
  clearInterval: { value: timer => clearInterval(unwrapTimer(timer)) },
});

// Polyfill for 'self' (needed for tronweb in Node.js environment)
if (typeof global.self === "undefined") {
  global.self = global;
}

// Polyfill for libsodium-wrappers (needed for cosmos-related packages)
if (typeof global.window === "undefined") {
  global.window = global;
}

Object.defineProperties(global, {
  fetch: { value: fetch, writable: true, configurable: true },
  Blob: { value: Blob, writable: true, configurable: true },
  File: { value: File, writable: true, configurable: true },
  Headers: { value: Headers, writable: true, configurable: true },
  FormData: { value: FormData, writable: true, configurable: true },
  Request: { value: Request, writable: true, configurable: true },
  Response: { value: Response, writable: true, configurable: true },
});
