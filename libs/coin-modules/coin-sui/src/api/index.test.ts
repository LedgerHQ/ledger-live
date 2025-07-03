import { createApi } from "./index";
import * as logic from "../logic";
import type { SuiCoinConfig } from "../config";

jest.mock("../logic");
jest.mock("../config", () => ({
  __esModule: true,
  default: {
    setCoinConfig: jest.fn(),
    getCoinConfig: jest.fn(),
  },
}));

const mockConfig: SuiCoinConfig = {
  node: { url: "http://localhost:1234" },
  status: { type: "active" },
};

describe("api/index", () => {
  let api: ReturnType<typeof createApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi(mockConfig);
  });

  it("should set coin config and return API object", () => {
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
    const result = await api.broadcast("tx");
    expect(mockBroadcast).toHaveBeenCalledWith("tx");
    expect(result).toBe("broadcasted");
  });

  it("should call combine from logic", async () => {
    const mockCombine = jest.spyOn(logic, "combine").mockReturnValue("combined-tx");
    const arg1 = "txstring";
    const arg2 = "sigstring";
    const result = api.combine(arg1, arg2);
    expect(mockCombine).toHaveBeenCalledWith(arg1, arg2);
    expect(result).toBe("combined-tx");
  });

  it("should call craftTransaction via craft wrapper and return hex string", async () => {
    const unsigned = Buffer.from("unsignedTx");
    jest.spyOn(logic, "craftTransaction").mockResolvedValue({ unsigned });
    const txIntent = { foo: "bar" } as any;
    const result = await api.craftTransaction(txIntent);
    expect(result).toBe(unsigned.toString("hex"));
    expect(logic.craftTransaction).toHaveBeenCalledWith(txIntent);
  });

  it("should call estimateFees via estimate wrapper and return FeeEstimation", async () => {
    jest.spyOn(logic, "estimateFees").mockResolvedValue(123n);
    const txIntent = { foo: "bar" } as any;
    const result = await api.estimateFees(txIntent);
    expect(result).toEqual({ value: 123n });
    expect(logic.estimateFees).toHaveBeenCalledWith(txIntent);
  });

  it("should call getBalance from logic", async () => {
    const mockGetBalance = jest
      .spyOn(logic, "getBalance")
      .mockResolvedValue([{ value: 42n, spendableBalance: 42n, asset: { type: "native" } }]);
    const result = await api.getBalance("address");
    expect(mockGetBalance).toHaveBeenCalledWith("address");
    expect(result).toEqual([{ value: 42n, spendableBalance: 42n, asset: { type: "native" } }]);
  });

  it("should call lastBlock from logic", async () => {
    const mockLastBlock = jest
      .spyOn(logic, "lastBlock")
      .mockResolvedValue({ hash: "h", height: 1, time: new Date() });
    const result = await api.lastBlock();
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
        block: { height: 1 },
        fees: 1n,
        date: new Date(),
      },
    };
    const mockListOperations = jest
      .spyOn(logic, "listOperations")
      .mockResolvedValue([[minimalOperation], ""]); // Return empty string for cursor
    const result = await api.listOperations("address", { minHeight: 0 });
    expect(mockListOperations).toHaveBeenCalledWith("address", { minHeight: 0 });
    expect(result).toEqual([[minimalOperation], ""]);
  });

  it("should throw if craftTransaction throws", async () => {
    jest.spyOn(logic, "craftTransaction").mockRejectedValue(new Error("fail"));
    await expect(api.craftTransaction({} as any)).rejects.toThrow("fail");
  });

  it("should throw if estimateFees throws", async () => {
    jest.spyOn(logic, "estimateFees").mockRejectedValue(new Error("fail"));
    await expect(api.estimateFees({} as any)).rejects.toThrow("fail");
  });
});
