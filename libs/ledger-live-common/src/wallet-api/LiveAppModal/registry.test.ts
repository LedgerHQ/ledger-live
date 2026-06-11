import * as registry from "./registry";
import { LiveAppModalAlreadyOpenError, LiveAppModalUnknownRequestIdError } from "./types";

describe("LiveAppModal registry", () => {
  beforeEach(() => {
    registry.__resetForTests();
  });

  it("creates a request and returns a requestId + pending promise", async () => {
    const { requestId, promise } = registry.createRequest({ payload: { foo: 1 } });
    expect(typeof requestId).toBe("string");
    expect(requestId.length).toBeGreaterThan(0);

    let settled = false;
    promise.then(() => (settled = true));
    // Give microtasks a chance
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it("rejects createRequest when another request is already open (depth guard)", () => {
    registry.createRequest({ payload: "first" });
    expect(() => registry.createRequest({ payload: "second" })).toThrow(
      LiveAppModalAlreadyOpenError,
    );
  });

  it("allows a new request after the previous one closes", () => {
    const first = registry.createRequest({ payload: "first" });
    registry.close(first.requestId, "result");
    expect(() => registry.createRequest({ payload: "second" })).not.toThrow();
  });

  it("allows a new request after the previous one is dismissed", () => {
    const first = registry.createRequest({ payload: "first" });
    registry.dismiss(first.requestId);
    expect(() => registry.createRequest({ payload: "second" })).not.toThrow();
  });

  it("returns the payload via getPayload", () => {
    const payload = { assets: ["BTC", "ETH"] };
    const { requestId } = registry.createRequest({ payload });
    expect(registry.getPayload(requestId)).toEqual(payload);
  });

  it("throws LiveAppModalUnknownRequestIdError for unknown requestId", () => {
    expect(() => registry.getPayload("unknown-id")).toThrow(LiveAppModalUnknownRequestIdError);
  });

  it("resolves the pending promise with the result when close is called", async () => {
    const { requestId, promise } = registry.createRequest({ payload: null });
    registry.close(requestId, { picked: "SOL" });
    await expect(promise).resolves.toEqual({ result: { picked: "SOL" } });
  });

  it("resolves the pending promise with undefined result when dismissed", async () => {
    const { requestId, promise } = registry.createRequest({ payload: null });
    registry.dismiss(requestId);
    await expect(promise).resolves.toEqual({ result: undefined });
  });

  it("invokes the registered close handler when close() is called", () => {
    const handler = jest.fn();
    const { requestId } = registry.createRequest({ payload: null });
    registry.registerCloseHandler(requestId, handler);
    registry.close(requestId);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not invoke the close handler when dismissed (UI unmounts itself)", () => {
    const handler = jest.fn();
    const { requestId } = registry.createRequest({ payload: null });
    registry.registerCloseHandler(requestId, handler);
    registry.dismiss(requestId);
    expect(handler).not.toHaveBeenCalled();
  });

  it("is a no-op when close is called twice (idempotent settle)", async () => {
    const { requestId, promise } = registry.createRequest({ payload: null });
    registry.close(requestId, "first");
    registry.close(requestId, "second");
    await expect(promise).resolves.toEqual({ result: "first" });
  });

  it("is a no-op when close is called after dismiss", async () => {
    const { requestId, promise } = registry.createRequest({ payload: null });
    registry.dismiss(requestId);
    registry.close(requestId, "late-result");
    await expect(promise).resolves.toEqual({ result: undefined });
  });

  it("rejects the promise with the provided error when cancel() is called", async () => {
    const { requestId, promise } = registry.createRequest({ payload: null });
    const err = new Error("boom");
    registry.cancel(requestId, err);
    await expect(promise).rejects.toBe(err);
  });

  it("close on stale requestId is a no-op and does not crash", () => {
    expect(() => registry.close("nonexistent", "x")).not.toThrow();
    expect(() => registry.dismiss("nonexistent")).not.toThrow();
  });

  it("getPayload after settle throws (entry cleared)", () => {
    const { requestId } = registry.createRequest({ payload: "p" });
    registry.close(requestId);
    expect(() => registry.getPayload(requestId)).toThrow(LiveAppModalUnknownRequestIdError);
  });
});
