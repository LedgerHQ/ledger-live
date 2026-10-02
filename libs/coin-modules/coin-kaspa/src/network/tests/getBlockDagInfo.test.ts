import { getBlockDagInfo } from "../index";

describe("getBlockDagInfo", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });

  it("Check if getBlockDagInfo gives correct output", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        networkName: "kaspa-mainnet",
        blockCount: "220840",
        headerCount: "220840",
        tipHashes: ["d604806a806c9a0e4573b772a9b6a6595b4a8ca8baa2ea48a62fb8733f1677b3"],
        difficulty: 620427120032880600,
        pastMedianTime: "1737569348584",
        virtualParentHashes: ["d604806a806c9a0e4573b772a9b6a6595b4a8ca8baa2ea48a62fb8733f1677b3"],
        pruningPointHash: "3914b495474186cbf116561e935a11a1991e42b26e7fbbc4658a0c50cb5d2fa6",
        virtualDaaScore: "101277083",
      }),
    });

    const result = await getBlockDagInfo();

    expect(result.pastMedianTime).toBe("1737569348584");
    expect(result.blockCount).toBe("220840");
  });
});
it("Should throw an error when fetch returns a 500 response", async () => {
  // A 5xx is retried first (fetchWithRetry); the error surfaces once every attempt has failed.
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
  });

  const outcome = getBlockDagInfo().catch((error: Error) => error);
  await jest.advanceTimersByTimeAsync(15_000);

  expect(((await outcome) as Error).message).toBe(
    "Failed to fetch BlockDAG info. Error: Error: Status: 500",
  );
  expect(global.fetch).toHaveBeenCalledTimes(5);
  jest.useRealTimers();
});
