import { grpcWebFetch } from "./fetch";

jest.mock("../fetcher", () => ({ fetcher: jest.fn() }));
const { fetcher } = jest.requireMock("../fetcher") as { fetcher: jest.Mock };

const drain = async (body: unknown): Promise<Uint8Array[]> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(chunk);
  return chunks;
};

const reactNativeResponse = (payload: string, contentType: string): Response =>
  ({
    // React Native's whatwg-fetch never populates `body`.
    body: null,
    status: 200,
    headers: new Headers({ "content-type": contentType }),
    text: async () => payload,
    arrayBuffer: async () => new TextEncoder().encode(payload).buffer,
  }) as unknown as Response;

describe("grpcWebFetch", () => {
  afterEach(() => fetcher.mockReset());

  it("passes the response through untouched when a real stream exists", async () => {
    const streamed = { body: new ReadableStream(), headers: new Headers() } as unknown as Response;
    fetcher.mockResolvedValue(streamed);

    await expect(grpcWebFetch("https://node.example/x")).resolves.toBe(streamed);
  });

  // The transport defaults to text format, where the frame reader consumes the base64 text's own
  // bytes rather than decoded protobuf.
  it("buffers a text-format body into an async iterable of the base64 bytes", async () => {
    fetcher.mockResolvedValue(reactNativeResponse("AAAAAAA=", "application/grpc-web-text+proto"));

    const chunks = await drain((await grpcWebFetch("https://node.example/x")).body);

    expect(chunks).toHaveLength(1);
    expect(new TextDecoder().decode(chunks[0])).toBe("AAAAAAA=");
  });

  it("buffers a binary-format body as raw bytes", async () => {
    fetcher.mockResolvedValue(reactNativeResponse("\u0000\u0001", "application/grpc-web+proto"));

    const [chunk] = await drain((await grpcWebFetch("https://node.example/x")).body);

    expect(Array.from(chunk)).toEqual([0, 1]);
  });

  // `readGrpcWebResponseBody` treats anything exposing `getReader` as a whatwg stream; the
  // buffered body must not, or it takes the wrong branch and reads nothing.
  it("exposes no getReader on the buffered body, and preserves status and headers", async () => {
    fetcher.mockResolvedValue(reactNativeResponse("AAAAAAA=", "application/grpc-web-text+proto"));

    const response = await grpcWebFetch("https://node.example/x");

    expect((response.body as unknown as { getReader?: unknown }).getReader).toBeUndefined();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/grpc-web-text+proto");
  });

  // A plain object cast to `Response` has no private slots, so it cannot catch a proxy that
  // forwards itself as the accessor receiver. A genuine `Response` is the only shape that exercises
  // the brand checks protobuf-ts trips on when it reads the headers, before touching the body.
  it("preserves the accessors of a genuine Response whose body is null", async () => {
    const real = new Response(null, {
      status: 503,
      statusText: "Unavailable",
      headers: { "content-type": "application/grpc-web-text+proto" },
    });
    fetcher.mockResolvedValue(real);

    const wrapped = await grpcWebFetch("https://node.example/x");

    expect(wrapped.status).toBe(503);
    expect(wrapped.statusText).toBe("Unavailable");
    expect(wrapped.ok).toBe(false);
    expect(wrapped.headers.get("content-type")).toBe("application/grpc-web-text+proto");
    // Native methods must stay callable: an unbound one throws when invoked on the proxy.
    await expect(wrapped.text()).resolves.toBe("");
  });

  it("is consumable by protobuf-ts's own frame reader", async () => {
    // A single empty DATA frame followed by a trailer frame, base64-encoded as the wire carries it.
    const { readGrpcWebResponseBody } = await import("@protobuf-ts/grpcweb-transport");
    const frames = Buffer.concat([
      Buffer.from([0x00, 0, 0, 0, 0]), // DATA, length 0
      Buffer.from([0x80, 0, 0, 0, 0]), // TRAILER, length 0
    ]).toString("base64");
    fetcher.mockResolvedValue(reactNativeResponse(frames, "application/grpc-web-text+proto"));

    const response = await grpcWebFetch("https://node.example/x");
    const seen: number[] = [];
    await readGrpcWebResponseBody(
      response.body as never,
      response.headers.get("content-type"),
      (type: number) => seen.push(type),
    );

    expect(seen).toEqual([0x00, 0x80]);
  });
});
