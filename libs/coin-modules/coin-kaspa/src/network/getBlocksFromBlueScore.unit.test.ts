import { getBlocksFromBlueScore } from "./getBlocksFromBlueScore";

describe("getBlocksFromBlueScore", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it("returns the parsed array of blocks on a 200 response", async () => {
    const blocks = [{ verboseData: { hash: "a".repeat(64), isChainBlock: true } }];
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => blocks });

    const result = await getBlocksFromBlueScore(480818084);

    expect(result).toEqual(blocks);
  });

  it("requests includeTransactions=false by default", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    await getBlocksFromBlueScore(480818084);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/blocks-from-bluescore?blueScore=480818084&includeTransactions=false",
      ),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests includeTransactions=true when asked", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });

    await getBlocksFromBlueScore(480818084, true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("includeTransactions=true"),
      expect.anything(),
    );
  });

  it("throws with the status code once a 5xx has been retried", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const outcome = getBlocksFromBlueScore(480818084).catch((error: Error) => error);
    await jest.advanceTimersByTimeAsync(15_000);

    expect(((await outcome) as Error).message).toBe("kaspa: getBlocksFromBlueScore: status 500");
    expect(global.fetch).toHaveBeenCalledTimes(5);
    jest.useRealTimers();
  });

  it.each([-1, 1.5, Number.NaN])(
    "rejects an invalid blueScore (%s) without a request",
    async score => {
      global.fetch = jest.fn();

      await expect(getBlocksFromBlueScore(score)).rejects.toThrow(
        `kaspa: getBlocksFromBlueScore: invalid blueScore ${score}`,
      );
      expect(global.fetch).not.toHaveBeenCalled();
    },
  );

  it("throws at once on a non-retried status", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(getBlocksFromBlueScore(480818084)).rejects.toThrow(
      "kaspa: getBlocksFromBlueScore: status 404",
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("waits out a 429 (rate limit) and returns the blocks once the indexer answers", async () => {
    jest.useFakeTimers();
    const blocks = [{ verboseData: { hash: "a".repeat(64), isChainBlock: true } }];
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, headers: { get: () => null } })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => blocks });

    const promise = getBlocksFromBlueScore(480818084);
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(promise).resolves.toEqual(blocks);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
