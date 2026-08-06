import { setCoinConfig } from "../config";
import { TEST_ADDRESSES } from "../__tests__/fixtures/addresses.fixture";
import { createApi } from "./index";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

const mockConfig = jest.fn().mockReturnValue({
  status: { type: "active" },
  infra: {
    API_CASPER_NODE_ENDPOINT: "https://mock.node",
    API_CASPER_INDEXER: "https://mock.indexer",
  },
});

describe("createApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls setCoinConfig with the provided config", () => {
    createApi(mockConfig);
    expect(setCoinConfig).toHaveBeenCalledWith(mockConfig);
  });

  it("returns an object with all CoinModuleApi methods", () => {
    const api = createApi(mockConfig);
    const methods = [
      "lastBlock",
      "getBlockInfo",
      "getBlock",
      "call",
      "getValidators",
      "getBalance",
      "listOperations",
      "getStakes",
      "getRewards",
      "craftTransaction",
      "craftRawTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "validateIntent",
      "getNextSequence",
      "validateAddress",
      "craftTransactionData",
    ];
    for (const method of methods) {
      expect(typeof api[method as keyof typeof api]).toBe("function");
    }
  });

  it.each([
    ["lastBlock", []],
    ["broadcast", ["rawTx"]],
    ["combine", ["tx", "sig"]],
    ["validateAddress", ["addr", {}]],
  ])("%s throws 'not supported'", (_method, args) => {
    const api = createApi(mockConfig);
    const fn = api[_method as keyof typeof api] as (...a: unknown[]) => unknown;
    expect(() => fn(...args)).toThrow(`${_method} is not supported`);
  });

  describe("getBalance", () => {
    it("rejects balance options instead of silently dropping them", async () => {
      const api = createApi(mockConfig);

      await expect(
        api.getBalance(TEST_ADDRESSES.SECP256K1, { includeAssets: async () => true }),
      ).rejects.toThrow("getBalance does not support the options parameter");
    });
  });
});
