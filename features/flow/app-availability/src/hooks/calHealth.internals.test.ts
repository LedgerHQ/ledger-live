import { CAL_HEALTHCHECK_TIMEOUT_MS, checkCalHealth } from "./calHealth.internals";

const CLIENT_VERSION = "1.2.3";

function probe(overrides: Partial<Parameters<typeof checkCalHealth>[0]> = {}) {
  return checkCalHealth({
    calServiceUrl: "https://cal.test",
    ledgerClientVersion: CLIENT_VERSION,
    ...overrides,
  });
}

describe("checkCalHealth", () => {
  it("should return ok when CAL answers successfully", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });

    await expect(probe({ fetchImpl })).resolves.toBe("ok");

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://cal.test/v1/currencies?output=id&limit=1",
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        headers: { "X-Ledger-Client-Version": CLIENT_VERSION },
      }),
    );
  });

  it("should return failed on a 5xx response", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(probe({ fetchImpl })).resolves.toBe("failed");
  });

  it("should return ok on a 4xx response", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(probe({ fetchImpl })).resolves.toBe("ok");
  });

  it("should return failed when the request times out", async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    const pending = probe({
      fetchImpl,
      timeoutMs: CAL_HEALTHCHECK_TIMEOUT_MS,
    });

    await jest.advanceTimersByTimeAsync(CAL_HEALTHCHECK_TIMEOUT_MS);

    await expect(pending).resolves.toBe("failed");
    jest.useRealTimers();
  });

  it("should return offline when the OS reports no connectivity", async () => {
    const fetchImpl = jest.fn();

    await expect(probe({ fetchImpl, isOffline: () => true })).resolves.toBe("offline");

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("should return offline on a network error", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(probe({ fetchImpl })).resolves.toBe("offline");
  });

  it("should return failed on an unexpected error", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("boom"));

    await expect(probe({ fetchImpl })).resolves.toBe("failed");
  });

  it("should return failed for a bad service URL", async () => {
    const fetchImpl = jest.fn();

    await expect(probe({ calServiceUrl: "", fetchImpl })).resolves.toBe("failed");
    await expect(probe({ calServiceUrl: "not a url", fetchImpl })).resolves.toBe("failed");
    await expect(probe({ calServiceUrl: "ftp://cal.test", fetchImpl })).resolves.toBe("failed");
    await expect(probe({ calServiceUrl: "file:///tmp/cal", fetchImpl })).resolves.toBe("failed");

    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
