import { BalanceOptions, Page, Reward, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { SuiCoinConfig, SuiContext } from "../config";
import * as logic from "../logic";
import { createApi } from "./index";

jest.mock("../logic");

const mockSetCoinConfig = jest.fn();
jest.mock("../config", () => ({
  __esModule: true,
  default: {
    setCoinConfig: (...args: unknown[]) => mockSetCoinConfig(...args),
    getCoinConfig: jest.fn(),
  },
}));

const mockConfig: SuiCoinConfig = {
  node: {
    url: "http://localhost:1234",
    graphqlUrl: "http://localhost:1234/graphql",
    grpcUrl: "http://localhost:1234",
  },
  status: { type: "active" },
  features: { transport: "json" },
};

const context: SuiContext = {
  config: async () => mockConfig,
  logger: () => {},
};

describe("api/index", () => {
  let api: ReturnType<typeof createApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi();
  });

  it("omits the capabilities the chain has none of", () => {
    for (const method of [
      "call",
      "register",
      "craftRawTransaction",
      "validateIntent",
      "getNextSequence",
    ] as const) {
      expect(api).not.toHaveProperty(method);
    }
  });

  it("should return API object", () => {
    expect(typeof api).toBe("object");
    expect(Object.keys(api)).toEqual(
      expect.arrayContaining([
        "broadcast",
        "combine",
        "craftTransaction",
        "estimateFees",
        "getBalance",
        "lastBlock",
        "listOperations",
      ]),
    );
  });

  it("should call broadcast from logic", async () => {
    const mockBroadcast = jest.spyOn(logic, "broadcast").mockResolvedValue("broadcasted");
    const result = await api.broadcast(context, "tx");
    expect(mockBroadcast).toHaveBeenCalledWith(mockConfig, "tx");
    expect(result).toBe("broadcasted");
  });

  it("should call combine from logic", async () => {
    const mockCombine = jest.spyOn(logic, "combine").mockReturnValue("combined-tx");
    const arg1 = "txstring";
    const arg2 = ["sigstring"];
    const result = api.combine(context, arg1, arg2);
    expect(mockCombine).toHaveBeenCalledWith(arg1, arg2);
    expect(result).toBe("combined-tx");
  });

  it("should call craftTransaction via craft wrapper and return hex string", async () => {
    const unsigned = Buffer.from("unsignedTx");
    jest.spyOn(logic, "craftTransaction").mockResolvedValue({ unsigned });
    const txIntent = { foo: "bar" } as any;
    const { transaction: result } = await api.craftTransaction(context, txIntent);
    expect(result).toBe(unsigned.toString("hex"));
    expect(logic.craftTransaction).toHaveBeenCalledWith(mockConfig, txIntent, true, undefined);
  });

  it("should call estimateFees via estimate wrapper and return FeeEstimation", async () => {
    jest.spyOn(logic, "estimateFees").mockResolvedValue({ fees: 123n, gasBudget: 200n });
    const txIntent = { foo: "bar" } as any;
    const result = await api.estimateFees(context, txIntent);
    expect(result).toEqual({ value: 200n }); // framework reports the positive gas budget
    expect(logic.estimateFees).toHaveBeenCalledWith(mockConfig, txIntent);
  });

  it("should call getBalance from logic", async () => {
    const mockGetBalance = jest
      .spyOn(logic, "getBalance")
      .mockResolvedValue([{ value: 42n, asset: { type: "native" } }]);
    const result = await api.getBalance(context, "address");
    expect(mockGetBalance).toHaveBeenCalledWith(mockConfig, "address");
    expect(result).toEqual([{ value: 42n, asset: { type: "native" } }]);
  });

  it("should call lastBlock from logic", async () => {
    const mockLastBlock = jest
      .spyOn(logic, "lastBlock")
      .mockResolvedValue({ hash: "h", height: 1, time: new Date() });
    const result = await api.lastBlock(context);
    expect(mockLastBlock).toHaveBeenCalled();
    expect(result).toHaveProperty("hash");
    expect(result).toHaveProperty("height");
    expect(result).toHaveProperty("time");
  });

  it("should call listOperations from logic", async () => {
    const minimalOperation = {
      id: "op1",
      type: "IN",
      senders: ["sender1"],
      recipients: ["recipient1"],
      value: 1n,
      asset: { type: "native" as const },
      tx: {
        hash: "hash1",
        block: { height: 1, hash: "block-hash-1", time: new Date() },
        fees: 1n,
        date: new Date(),
        failed: false,
      },
    };
    const mockListOperations = jest
      .spyOn(logic, "listOperations")
      .mockResolvedValue({ items: [minimalOperation], next: undefined });
    const result = await api.listOperations(context, "address", { minHeight: 0, order: "asc" });
    expect(mockListOperations).toHaveBeenCalledWith(mockConfig, "address", {
      minHeight: 0,
      order: "asc",
    });
    expect(result).toEqual({ items: [minimalOperation], next: undefined });
  });

  it("should call getStakes from logic", async () => {
    const value = {
      items: [
        {
          uid: "stake-uid",
          address: "stake-address",
          delegate: "stake-delegate",
          state: "activating",
          asset: { type: "native" },
          amount: 3n,
          amountDeposited: 1n,
          amountRewarded: 2n,
          actions: [],
          details: { foo: "bar" },
        },
      ],
    } as Page<Stake>;
    const mockGetStakes = jest.spyOn(logic, "getStakes").mockResolvedValue(value);
    const result = await api.getStakes(context, "address");
    expect(mockGetStakes).toHaveBeenCalledWith(mockConfig, "address", undefined);
    expect(result).toEqual(value);
  });

  it("should call getRewards from logic", async () => {
    const value = {
      items: [
        {
          stake: "stake-uid",
          asset: { type: "native" },
          amount: 3n,
          receivedAt: new Date(1337),
        },
      ],
    } as Page<Reward>;
    const mockGetRewards = jest.spyOn(logic, "getRewards").mockResolvedValue(value);
    const result = await api.getRewards(context, "address");
    expect(mockGetRewards).toHaveBeenCalledWith("address", undefined);
    expect(result).toEqual(value);
  });

  it("should throw if craftTransaction throws", async () => {
    jest.spyOn(logic, "craftTransaction").mockRejectedValue(new Error("fail"));
    await expect(api.craftTransaction(context, {} as any)).rejects.toThrow("fail");
  });

  it("should throw if estimateFees throws", async () => {
    jest.spyOn(logic, "estimateFees").mockRejectedValue(new Error("fail"));
    await expect(api.estimateFees(context, {} as any)).rejects.toThrow("fail");
  });

  describe("getBalance", () => {
    it("should throw an exception when options is provided", async () => {
      await expect(
        api.getBalance(context, "random address", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({ name: "InvalidParameterError" });
    });
  });
});
