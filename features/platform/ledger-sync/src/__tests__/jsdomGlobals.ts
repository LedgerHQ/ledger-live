import { runInThisContext } from "node:vm";

// jsdom has neither the Encoding API nor fetch, which the key ring crypto, MSW and Cloud Sync
// read: lend them from Node, before any test file loads.
const node = runInThisContext("globalThis") as typeof globalThis;

Object.assign(globalThis, {
  TextEncoder: node.TextEncoder,
  TextDecoder: node.TextDecoder,
  fetch: node.fetch,
  Headers: node.Headers,
  Request: node.Request,
  Response: node.Response,
  ReadableStream: node.ReadableStream,
  WritableStream: node.WritableStream,
  TransformStream: node.TransformStream,
  BroadcastChannel: node.BroadcastChannel,
});
