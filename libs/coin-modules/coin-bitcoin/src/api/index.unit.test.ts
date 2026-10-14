jest.mock("../logic/index", () => {
  const actual = jest.requireActual("../logic/index");
  return {
    ...actual,
    explorerFor: jest.fn(),
    lastBlock: jest.fn(async () => "lastBlock"),
    getBlockInfo: jest.fn(async () => "getBlockInfo"),
    getBalance: jest.fn(async () => "getBalance"),
    listOperations: jest.fn(async () => "listOperations"),
    estimateFees: jest.fn(async () => "estimateFees"),
    validateIntent: jest.fn(async () => "validateIntent"),
    craftTransaction: jest.fn(async () => "craftTransaction"),
    combine: jest.fn(() => "combine"),
    broadcast: jest.fn(async () => "broadcast"),
    isValidAddress: jest.fn(() => true),
  };
});
import * as logic from "../logic/index";
import { createApi } from "./index";

const explorer = { baseUrl: "fake" };
const context = { config: jest.fn(), logger: jest.fn() };
const intent = { recipient: "r" } as never;

beforeEach(() => (logic.explorerFor as jest.Mock).mockResolvedValue(explorer));

describe("createApi", () => {
  const api = createApi("bitcoin");

  it("resolves the explorer of the currency from the context", async () => {
    await api.lastBlock(context);
    expect(logic.explorerFor).toHaveBeenCalledWith(context, "bitcoin");
  });

  it.each([
    ["lastBlock", () => api.lastBlock(context), logic.lastBlock, [explorer]],
    ["getBlockInfo", () => api.getBlockInfo(context, 7), logic.getBlockInfo, [explorer, 7]],
    [
      "listOperations",
      () => api.listOperations(context, "a", { minHeight: 1 }),
      logic.listOperations,
      [explorer, "a", { minHeight: 1 }],
    ],
    [
      "estimateFees",
      () => api.estimateFees(context, intent, { customFeesParameters: { x: 1 } }),
      logic.estimateFees,
      [explorer, "bitcoin", intent, { x: 1 }],
    ],
    [
      "validateIntent",
      () => api.validateIntent(context, intent, [], { customFees: { value: 1n } }),
      logic.validateIntent,
      [explorer, "bitcoin", intent, { value: 1n }],
    ],
    [
      "craftTransaction",
      () => api.craftTransaction(context, intent, { customFees: { value: 2n } }),
      logic.craftTransaction,
      [explorer, "bitcoin", intent, { value: 2n }],
    ],
    [
      "broadcast",
      () => api.broadcast(context, "hex", { broadcastConfig: { mevProtected: false } }),
      logic.broadcast,
      [explorer, "hex", { mevProtected: false }],
    ],
  ] as const)("delegates %s to the logic", async (name, call, delegate, args) => {
    expect(await call()).toBe(name);
    expect(delegate).toHaveBeenCalledWith(...args);
  });

  it("reads balances without options", async () => {
    expect(await api.getBalance(context, "a")).toBe("getBalance");
    expect(logic.getBalance).toHaveBeenCalledWith(explorer, "a");
  });

  it("refuses balance options it cannot honour", async () => {
    await expect(
      api.getBalance(context, "a", { includeAssets: async () => true }),
    ).rejects.toThrow();
  });

  it("works without option bags", async () => {
    await api.estimateFees(context, intent);
    expect(logic.estimateFees).toHaveBeenLastCalledWith(explorer, "bitcoin", intent, undefined);
    await api.validateIntent(context, intent, []);
    expect(logic.validateIntent).toHaveBeenLastCalledWith(explorer, "bitcoin", intent, undefined);
    await api.craftTransaction(context, intent);
    expect(logic.craftTransaction).toHaveBeenLastCalledWith(explorer, "bitcoin", intent, undefined);
    await api.broadcast(context, "hex");
    expect(logic.broadcast).toHaveBeenLastCalledWith(explorer, "hex", undefined);
  });

  it("combines and validates addresses without the network", async () => {
    expect(api.combine(context, "tx", ["sig"])).toBe("combine");
    expect(logic.combine).toHaveBeenCalledWith("tx", ["sig"]);
    expect(await api.validateAddress(context, "addr")).toBe(true);
    expect(logic.isValidAddress).toHaveBeenCalledWith("addr", "bitcoin");
  });

  it("has no transaction data of its own to craft", () => {
    expect(api.craftTransactionData(context, intent)).toEqual({ type: "bitcoin" });
  });
});
