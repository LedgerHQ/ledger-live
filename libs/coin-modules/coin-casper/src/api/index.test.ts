import { setCoinConfig } from "../config";
import { lastBlock as lastBlockLogic } from "../logic/lastBlock";
import { listOperations as listOperationsLogic } from "../logic/listOperations";
import { createApi } from "./index";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

jest.mock("../logic/lastBlock", () => ({
  lastBlock: jest.fn(),
}));

jest.mock("../logic/listOperations", () => ({
  listOperations: jest.fn(),
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
    ["getBalance", ["someAddress"]],
    ["broadcast", ["rawTx"]],
    ["combine", ["tx", "sig"]],
    ["validateAddress", ["addr", {}]],
  ])("%s throws 'not supported'", (_method, args) => {
    const api = createApi(mockConfig);
    const fn = api[_method as keyof typeof api] as (...a: unknown[]) => unknown;
    expect(() => fn(...args)).toThrow(`${_method} is not supported`);
  });

  it("lastBlock delegates to logic/lastBlock", async () => {
    const mockBlock = { height: 42, hash: "0xdeadbeef", time: new Date("2024-01-01T00:00:00Z") };
    (lastBlockLogic as jest.Mock).mockResolvedValue(mockBlock);

    const api = createApi(mockConfig);
    const result = await api.lastBlock();

    expect(lastBlockLogic).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockBlock);
  });

  it("listOperations delegates to logic/listOperations", async () => {
    const page = { items: [], next: undefined };
    (listOperationsLogic as jest.Mock).mockResolvedValue(page);

    const api = createApi(mockConfig);
    const options = { minHeight: 0, order: "desc" as const };
    const result = await api.listOperations("some-public-key", options);

    expect(listOperationsLogic).toHaveBeenCalledWith("some-public-key", options);
    expect(result).toBe(page);
  });
});
