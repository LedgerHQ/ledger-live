import { createApi } from "./index";

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn().mockResolvedValue([]),
  lastBlock: jest.fn(),
  listOperations: jest.fn(),
}));

jest.mock("@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions", () => ({
  rejectBalanceOptions: (_fn: () => Promise<unknown>) => _fn(),
}));

jest.mock("@ledgerhq/coin-module-framework/logic/craftTransactionData", () => ({
  craftTransactionData: jest.fn(),
}));

jest.mock("@ledgerhq/coin-module-framework/config", () => ({
  __esModule: true,
  default: () => ({
    setCoinConfig: jest.fn(),
    getCoinConfig: jest.fn(),
  }),
}));

describe("createApi", () => {
  const config = {
    apiEndpoint: "https://filecoin.example.com",
    status: { type: "active" as const },
  };

  it("returns an object with all CoinModuleApi methods", () => {
    const api = createApi(config);

    expect(api).toHaveProperty("broadcast");
    expect(api).toHaveProperty("combine");
    expect(api).toHaveProperty("craftTransaction");
    expect(api).toHaveProperty("craftRawTransaction");
    expect(api).toHaveProperty("estimateFees");
    expect(api).toHaveProperty("getBalance");
    expect(api).toHaveProperty("lastBlock");
    expect(api).toHaveProperty("listOperations");
    expect(api).toHaveProperty("getBlock");
    expect(api).toHaveProperty("getBlockInfo");
    expect(api).toHaveProperty("getStakes");
    expect(api).toHaveProperty("getRewards");
    expect(api).toHaveProperty("getValidators");
    expect(api).toHaveProperty("validateIntent");
    expect(api).toHaveProperty("getNextSequence");
    expect(api).toHaveProperty("validateAddress");
    expect(api).toHaveProperty("craftTransactionData");
  });

  it("unsupported methods throw descriptive errors", () => {
    const api = createApi(config);

    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
    expect(() => api.getBlockInfo(1)).toThrow("getBlockInfo is not supported");
    expect(() => api.getStakes("addr")).toThrow("getStakes is not supported");
    expect(() => api.getRewards("addr")).toThrow("getRewards is not supported");
    expect(() => api.getValidators()).toThrow("getValidators is not supported");
    expect(() => api.craftRawTransaction("tx", "sender", "pk", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  it("supported methods delegate to logic functions", async () => {
    const api = createApi(config);

    // getBalance delegates to logic (mocked to return [])
    const balance = await api.getBalance("f1addr");
    expect(balance).toEqual([]);
  });
});
