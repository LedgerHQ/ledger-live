import { fetcher } from "../fetcher";

/**
 * gRPC-web fetch that tolerates runtimes with no streaming response body.
 *
 * React Native's `whatwg-fetch` never populates `Response.body`, and
 * `@protobuf-ts/grpcweb-transport` rejects with `missing response body` without it — on the unary
 * path as well as the streaming one — so gRPC-web cannot complete a call on mobile. Where the body
 * is absent it is buffered and re-exposed as an async iterable, the second shape
 * `readGrpcWebResponseBody` accepts alongside a whatwg `ReadableStream`. The gap is detected from
 * the response, not from the platform, so this is a pass-through wherever real streams exist.
 *
 * Buffering suits finite calls only: nothing is delivered until the response completes. That covers
 * every coin-sui call (unary plus finite `LedgerService.List*`) but rules out `SubscriptionService`,
 * which the module does not use.
 */
export const grpcWebFetch: typeof fetch = async (url, options) => {
  const response = await fetcher(url, options);
  if (response.body) return response;

  // The transport requests text format by default, in which case the frame reader expects the
  // base64 text's own bytes; a binary content-type means the frames are already raw bytes.
  const isText = response.headers.get("content-type")?.includes("text") ?? false;
  const bytes = isText
    ? new TextEncoder().encode(await response.text())
    : new Uint8Array(await response.arrayBuffer());

  // Deliberately no `getReader`: its absence is what routes the reader down its async-iterator
  // branch instead of treating this as a whatwg stream.
  const body = {
    async *[Symbol.asyncIterator]() {
      yield bytes;
    },
  };

  return new Proxy(response, {
    get(target, prop) {
      if (prop === "body") return body;
      // `Response`'s accessors and methods read private slots, so they must run with the real
      // response as receiver. Forwarding the proxy instead (the default third argument to
      // `Reflect.get`) makes `status`, `headers` and friends throw a TypeError on a genuine
      // `Response` — and protobuf-ts reads the headers before it ever touches the body.
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
};
