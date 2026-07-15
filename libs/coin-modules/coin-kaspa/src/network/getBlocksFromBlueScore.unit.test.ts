import { getBlocksFromBlueScore } from "./getBlocksFromBlueScore";

describe("getBlocksFromBlueScore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("throws with the status code on a non-ok response", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(getBlocksFromBlueScore(480818084)).rejects.toThrow(
      "kaspa: getBlocksFromBlueScore: status 500",
    );
  });
});
