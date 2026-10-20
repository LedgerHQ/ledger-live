import { retry } from "@ledgerhq/coin-module-framework/promises";
import { BROADCAST_RETRY, httpError, isRateLimited, isTransient, READ_RETRY } from "../retryPolicy";

describe("retry conditions", () => {
  it.each([
    { name: "HTTP 429", error: httpError("x", 429), transient: true, rateLimited: true },
    { name: "HTTP 500", error: httpError("x", 500), transient: true, rateLimited: false },
    { name: "HTTP 504", error: httpError("x", 504), transient: true, rateLimited: false },
    { name: "HTTP 400", error: httpError("x", 400), transient: false, rateLimited: false },
    { name: "HTTP 404", error: httpError("x", 404), transient: false, rateLimited: false },
    { name: "HTTP 422", error: httpError("x", 422), transient: false, rateLimited: false },
    {
      name: "network error (TypeError)",
      error: new TypeError("fetch failed"),
      transient: true,
      rateLimited: false,
    },
    { name: "plain Error", error: new Error("boom"), transient: false, rateLimited: false },
    { name: "non-error value", error: "boom", transient: false, rateLimited: false },
  ])(
    "$name → transient=$transient, rateLimited=$rateLimited",
    ({ error, transient, rateLimited }) => {
      expect(isTransient(error)).toBe(transient);
      expect(isRateLimited(error)).toBe(rateLimited);
    },
  );

  it("keeps the message and exposes the status", () => {
    const error = httpError("kaspa: status 429", 429);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("kaspa: status 429");
    expect(error.status).toBe(429);
  });
});

describe("retry schedules with the shared retry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("reads: 5 attempts, waiting 1, 2, 4 then 8 s, then gives up", async () => {
    const call = jest.fn().mockRejectedValue(httpError("throttled", 429));

    const outcome = retry(call, READ_RETRY).catch((error: Error) => error);
    await jest.advanceTimersByTimeAsync(0);
    let attempts = 1;
    expect(call).toHaveBeenCalledTimes(attempts);
    for (const wait of [1_000, 2_000, 4_000, 8_000]) {
      await jest.advanceTimersByTimeAsync(wait - 1);
      expect(call).toHaveBeenCalledTimes(attempts); // not a millisecond early
      await jest.advanceTimersByTimeAsync(1);
      expect(call).toHaveBeenCalledTimes(++attempts);
    }

    expect(((await outcome) as Error).message).toBe("throttled");
  });

  it("reads: retry a 5xx, then return the recovered result", async () => {
    const call = jest
      .fn()
      .mockRejectedValueOnce(httpError("gateway", 504))
      .mockResolvedValueOnce("ok");

    const outcome = retry(call, READ_RETRY);
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(outcome).resolves.toBe("ok");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("broadcast: retry a 429", async () => {
    const call = jest
      .fn()
      .mockRejectedValueOnce(httpError("throttled", 429))
      .mockResolvedValueOnce("ok");

    const outcome = retry(call, BROADCAST_RETRY);
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(outcome).resolves.toBe("ok");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it.each([
    { name: "a 5xx", error: httpError("gateway", 504) },
    { name: "a network error", error: new TypeError("fetch failed") },
  ])("broadcast: never retry $name — the transaction may already be out", async ({ error }) => {
    const call = jest.fn().mockRejectedValue(error);

    await expect(retry(call, BROADCAST_RETRY)).rejects.toBe(error);
    expect(call).toHaveBeenCalledTimes(1);
  });
});
