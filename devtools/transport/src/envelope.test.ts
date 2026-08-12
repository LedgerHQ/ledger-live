import { createEnvelope, encodeMessage } from "./envelope";

type TestMap = { ping: string; pong: number };

describe("createEnvelope", () => {
  it("should produce an envelope with the supplied origin, seq, kind, and payload", () => {
    const env = createEnvelope<TestMap, "ping">("test-origin", 1, "ping", "hello");
    expect(env.origin).toBe("test-origin");
    expect(env.seq).toBe(1);
    expect(env.kind).toBe("ping");
    expect(env.payload).toBe("hello");
  });

  it("should stamp a ts value close to Date.now()", () => {
    const before = Date.now();
    const env = createEnvelope<TestMap, "pong">("o", 0, "pong", 42);
    const after = Date.now();
    expect(env.ts).toBeGreaterThanOrEqual(before);
    expect(env.ts).toBeLessThanOrEqual(after);
  });

  it("should compose the id from origin, ts, and seq", () => {
    const env = createEnvelope<TestMap, "ping">("origin", 7, "ping", "x");
    expect(env.id).toBe(`origin-${env.ts}-7`);
  });

  it("should produce unique ids for successive calls with the same origin", () => {
    const a = createEnvelope<TestMap, "ping">("o", 1, "ping", "a");
    const b = createEnvelope<TestMap, "ping">("o", 2, "ping", "b");
    expect(a.id).not.toBe(b.id);
  });
});

describe("encodeMessage", () => {
  it("should return a JSON string that round-trips to a valid envelope", () => {
    const raw = encodeMessage<TestMap, "ping">("origin", 3, "ping", "world");
    const parsed = JSON.parse(raw);
    expect(parsed.origin).toBe("origin");
    expect(parsed.seq).toBe(3);
    expect(parsed.kind).toBe("ping");
    expect(parsed.payload).toBe("world");
    expect(typeof parsed.id).toBe("string");
    expect(typeof parsed.ts).toBe("number");
  });

  it("should encode the payload faithfully for numeric types", () => {
    const raw = encodeMessage<TestMap, "pong">("o", 0, "pong", 99);
    const parsed = JSON.parse(raw);
    expect(parsed.payload).toBe(99);
  });
});
