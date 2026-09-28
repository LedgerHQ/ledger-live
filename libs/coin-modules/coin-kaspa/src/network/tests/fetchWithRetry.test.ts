import { fetchWithRetry, parseRetryAfter } from "../fetchWithRetry";

const TEST_URL = "https://example.test/resource";

function reply(status: number, retryAfter?: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name === "retry-after" ? (retryAfter ?? null) : null) },
  };
}

describe("fetchWithRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the first ok response without retrying", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(reply(200));

    const response = await fetchWithRetry(TEST_URL);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries a 429 after the backoff and returns the recovered response", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(reply(429)).mockResolvedValueOnce(reply(200));

    const promise = fetchWithRetry(TEST_URL);
    await jest.advanceTimersByTimeAsync(999);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);

    expect((await promise).status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("backs off exponentially and returns the last 429 once attempts are spent", async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(429));

    const promise = fetchWithRetry(TEST_URL);
    // 1 s + 2 s + 4 s + 8 s between 5 attempts.
    await jest.advanceTimersByTimeAsync(14_999);
    expect(global.fetch).toHaveBeenCalledTimes(4);
    await jest.advanceTimersByTimeAsync(1);

    expect((await promise).status).toBe(429);
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });

  it("waits for Retry-After (seconds) instead of the backoff", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reply(429, "3"))
      .mockResolvedValueOnce(reply(200));

    const promise = fetchWithRetry(TEST_URL);
    await jest.advanceTimersByTimeAsync(2_999);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);

    expect((await promise).status).toBe(200);
  });

  it.each([400, 404, 422])("does not retry a %i", async status => {
    global.fetch = jest.fn().mockResolvedValue(reply(status));

    const response = await fetchWithRetry(TEST_URL, undefined, "transient");

    expect(response.status).toBe(status);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('leaves a 500 to the caller in "rate-limit" mode', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(500));

    const response = await fetchWithRetry(TEST_URL);

    expect(response.status).toBe(500);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries a 500 in "transient" mode', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(reply(503)).mockResolvedValueOnce(reply(200));

    const promise = fetchWithRetry(TEST_URL, undefined, "transient");
    await jest.advanceTimersByTimeAsync(1_000);

    expect((await promise).status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('rethrows a network error at once in "rate-limit" mode', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

    await expect(fetchWithRetry(TEST_URL)).rejects.toThrow("fetch failed");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries a network error in "transient" mode, then rethrows once attempts are spent', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

    // Capture the outcome up front so the rejection is handled while the fake timers run.
    const outcome = fetchWithRetry(TEST_URL, undefined, "transient").catch(
      (error: unknown) => error,
    );
    await jest.advanceTimersByTimeAsync(15_000);

    expect(await outcome).toEqual(new TypeError("fetch failed"));
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });

  it("never retries a non-network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("boom"));

    await expect(fetchWithRetry(TEST_URL, undefined, "transient")).rejects.toThrow("boom");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("parseRetryAfter", () => {
  const NOW = Date.parse("2026-09-28T12:00:00Z");

  it.each([
    { value: null, expected: undefined },
    { value: "", expected: undefined },
    { value: "garbage", expected: undefined },
    { value: "-1", expected: undefined },
    { value: "0", expected: 0 },
    { value: "3", expected: 3_000 },
    { value: "120", expected: 30_000 }, // capped
    { value: "Mon, 28 Sep 2026 12:00:05 GMT", expected: 5_000 },
    { value: "Mon, 28 Sep 2026 11:59:00 GMT", expected: undefined }, // already past
  ])("$value → $expected", ({ value, expected }) => {
    expect(parseRetryAfter(value, NOW)).toBe(expected);
  });
});
