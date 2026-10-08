import { createRetryPolicy, withRetries, type RetryPolicy } from "./retry";

const immediateRetries = (isRetryable: (error: unknown) => boolean): RetryPolicy => ({
  attempts: 3,
  delaysMs: [0, 0],
  isRetryable,
});

describe("withRetries", () => {
  it("returns the first result without retrying", async () => {
    const run = jest.fn().mockResolvedValue("read");

    await expect(
      withRetries(
        run,
        immediateRetries(() => true),
      ),
    ).resolves.toBe("read");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("retries a retryable failure until it succeeds", async () => {
    const run = jest.fn().mockRejectedValueOnce(new Error("flaky")).mockResolvedValue("read");

    await expect(
      withRetries(
        run,
        immediateRetries(() => true),
      ),
    ).resolves.toBe("read");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("throws the last failure once the attempts are exhausted", async () => {
    const lastError = new Error("third");
    const run = jest
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValueOnce(new Error("second"))
      .mockRejectedValue(lastError);

    await expect(
      withRetries(
        run,
        immediateRetries(() => true),
      ),
    ).rejects.toBe(lastError);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("throws a failure the policy rejects without retrying", async () => {
    const error = new Error("permanent");
    const run = jest.fn().mockRejectedValue(error);

    await expect(
      withRetries(
        run,
        immediateRetries(() => false),
      ),
    ).rejects.toBe(error);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs a single attempt when the policy allows none", async () => {
    const run = jest.fn().mockRejectedValue(new Error("failed"));

    await expect(
      withRetries(run, { attempts: 0, delaysMs: [], isRetryable: () => true }),
    ).rejects.toThrow("failed");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("gives up rather than reaching the device again once the caller cancelled", async () => {
    const run = jest.fn().mockRejectedValue(new Error("flaky"));
    const policy: RetryPolicy = { attempts: 3, delaysMs: [0], isRetryable: () => true };
    let cancelled = false;

    const result = withRetries(run, policy, { isCancelled: () => cancelled });
    cancelled = true;

    await expect(result).rejects.toThrow("flaky");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("waits the configured delay between attempts", async () => {
    jest.useFakeTimers();
    const run = jest.fn().mockRejectedValueOnce(new Error("flaky")).mockResolvedValue("read");
    const policy = createRetryPolicy(() => true);

    const result = withRetries(run, policy);
    await Promise.resolve();

    expect(run).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(299);
    expect(run).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe("read");
    expect(run).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it("reuses the last delay when there are more attempts than delays", async () => {
    jest.useFakeTimers();
    const run = jest.fn().mockRejectedValue(new Error("flaky"));
    const policy: RetryPolicy = { attempts: 4, delaysMs: [10], isRetryable: () => true };

    const result = withRetries(run, policy).catch(() => "failed");

    await jest.advanceTimersByTimeAsync(30);
    await expect(result).resolves.toBe("failed");
    expect(run).toHaveBeenCalledTimes(4);

    jest.useRealTimers();
  });
});

describe("createRetryPolicy", () => {
  it("allows three attempts with an increasing delay", () => {
    const policy = createRetryPolicy(() => true);

    expect(policy.attempts).toBe(3);
    expect(policy.delaysMs).toEqual([300, 900]);
  });
});
