import { getFeeEstimate } from "../index";

describe("getFees", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });

  it("Error response", async () => {
    // A 5xx is retried first (fetchWithRetry); the error surfaces once every attempt has failed.
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const outcome = getFeeEstimate().catch((error: Error) => error);
    await jest.advanceTimersByTimeAsync(15_000);

    expect(((await outcome) as Error).message).toContain("Network response was not ok");
    expect(global.fetch).toHaveBeenCalledTimes(5);
    jest.useRealTimers();
  });

  it("Check if getFees gives correct output", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        priorityBucket: {
          feerate: 1,
          estimatedSeconds: 0.004,
        },
        normalBuckets: [
          {
            feerate: 1,
            estimatedSeconds: 0.004,
          },
          {
            feerate: 1,
            estimatedSeconds: 0.004,
          },
        ],
        lowBuckets: [
          {
            feerate: 1,
            estimatedSeconds: 0.004,
          },
        ],
      }),
    });

    const result = await getFeeEstimate();

    expect(result.priorityBucket.feerate).toBeGreaterThan(0);
    expect(result.priorityBucket.estimatedSeconds).toBeGreaterThan(0);
    expect(result.normalBuckets.length).toBeGreaterThan(0);
    expect(result.normalBuckets[0].feerate).toBeGreaterThan(0);
    expect(result.normalBuckets[0].estimatedSeconds).toBeGreaterThan(0);
    expect(result.lowBuckets.length).toBeGreaterThan(0);
    expect(result.lowBuckets[0].feerate).toBeGreaterThan(0);
    expect(result.lowBuckets[0].estimatedSeconds).toBeGreaterThan(0);
  });
});
