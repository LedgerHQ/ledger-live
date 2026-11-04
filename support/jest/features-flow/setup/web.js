// Web (jsdom) setup the features-flow preset adds to the core's (see ../core/setup/web.js).

// jsdom doesn't implement the Encoding API, unlike every runtime this code ships to
// (browsers, React Native, Node). Packages reading TextEncoder at module-eval time
// (e.g. @ledgerhq/device-contacts-kit) throw on import without it.
import { TextDecoder, TextEncoder } from "node:util";
import { ReadableStream, TransformStream } from "node:stream/web";
import { BroadcastChannel, MessageChannel, MessagePort } from "node:worker_threads";
import { fetch, FormData, Headers, Request, Response } from "undici";

global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;

// jsdom ships no fetch, so MSW's interceptors throw on `Response` the moment a test imports them.
// Same primitives the apps polyfill (see apps/ledger-live-desktop/jest.polyfills.js).
// The streams have to land on the global before undici loads: it reads them at module eval.
// These have to land before undici loads: it reads them at module eval.

// React's scheduler assigns `onmessage` on a MessageChannel port, which refs a Node port and keeps
// the jest worker alive after the last test, so the ports are unref'd once their handler is set.
function UnrefMessageChannel() {
  const channel = new MessageChannel();
  const onmessage = Object.getOwnPropertyDescriptor(MessagePort.prototype, "onmessage");

  for (const port of [channel.port1, channel.port2]) {
    Object.defineProperty(port, "onmessage", {
      configurable: true,
      enumerable: true,
      get: () => onmessage.get.call(port),
      set(handler) {
        onmessage.set.call(port, handler);
        port.unref();
      },
    });
  }

  return channel;
}

global.ReadableStream ??= ReadableStream;
global.TransformStream ??= TransformStream;
global.BroadcastChannel ??= BroadcastChannel;
global.MessageChannel ??= UnrefMessageChannel;
global.MessagePort ??= MessagePort;

// The fetch primitives come as one set: MSW reads a `Request` and answers a `Response`, so two
// implementations meeting would fail the `instanceof` checks on either side.
if (!global.Response) {
  Object.assign(global, { fetch, Headers, FormData, Request, Response });
}
