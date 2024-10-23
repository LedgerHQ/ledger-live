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
// Note: this polyfill depends on the patch buffer@6.0.3 which adds the Uint8
// subarray logic. It's the same as in ledger-live-mobile
// Furthermore, importing 'buffer' gets translated to 'node:buffer' so we're
// using a relative path here
const { Buffer } = require("./node_modules/buffer");
const { fetch, Headers, FormData, Request, Response } = require("undici");

Object.defineProperties(globalThis, {
  fetch: { value: fetch, writable: true },
  Blob: { value: Blob },
  File: { value: File },
  Headers: { value: Headers },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response },
  Buffer: { value: Buffer },
});
