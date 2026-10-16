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
    listAddressTransactions: jest.fn(async () => "listAddressTransactions"),
    getTransaction: jest.fn(async () => "getTransaction"),
    selectInputs: jest.fn(async () => "selectInputs"),
    deriveAddress: jest.fn(async () => "deriveAddress"),
  };
});
import * as logic from "../logic/index";
import {
  BITCOIN_PICKING_STRATEGY,
  bitcoinDisplayAddress,
  createApi,
  toBitcoinDerivationMode,
} from "./index";

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
    [
      "listAddressTransactions",
      () => api.listAddressTransactions(context, "a", { minHeight: 2 }),
      logic.listAddressTransactions,
      [explorer, "a", { minHeight: 2 }],
    ],
    [
      "getTransaction",
      () => api.getTransaction(context, "txid"),
      logic.getTransaction,
      [explorer, "bitcoin", "txid"],
    ],
    [
      "selectInputs",
      () => api.selectInputs(context, { intent, candidates: [], strategy: 1 }),
      logic.selectInputs,
      [explorer, "bitcoin", { intent, candidates: [], strategy: 1 }, context.logger],
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

  it("hands the logic a bech32 recipient in lowercase", async () => {
    const typed = { recipient: "BC1QME" } as never;
    const normalized = { recipient: "bc1qme" };
    await api.estimateFees(context, typed);
    await api.validateIntent(context, typed, []);
    await api.craftTransaction(context, typed);
    await api.selectInputs(context, { intent: typed, candidates: [] });
    expect((logic.estimateFees as jest.Mock).mock.lastCall[2]).toEqual(normalized);
    expect((logic.validateIntent as jest.Mock).mock.lastCall[2]).toEqual(normalized);
    expect((logic.craftTransaction as jest.Mock).mock.lastCall[2]).toEqual(normalized);
    expect((logic.selectInputs as jest.Mock).mock.lastCall[2]).toEqual({
      intent: normalized,
      candidates: [],
    });
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

  it("derives addresses without the network", async () => {
    (logic.explorerFor as jest.Mock).mockClear();
    const request = { key: "xpub", derivationMode: "native_segwit", chain: 1, index: 4 };
    expect(await api.deriveAddress(context, request)).toBe("deriveAddress");
    expect(logic.deriveAddress).toHaveBeenCalledWith("bitcoin", request);
    expect(logic.explorerFor).not.toHaveBeenCalled();
  });

  it("shows the addresses of its currency", () => {
    const address = "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a";
    expect(createApi("bitcoin_cash").displayAddress(address)).toBe(
      "qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a",
    );
    expect(api.displayAddress(address)).toBe(address);
  });

  it("has no transaction data of its own to craft", () => {
    expect(api.craftTransactionData(context, intent)).toEqual({ type: "bitcoin" });
  });
});

describe("account-module helpers", () => {
  it("shows an address of a currency without an API", () => {
    expect(bitcoinDisplayAddress("bitcoin_cash", "bitcoincash:qq")).toBe("qq");
  });

  it("names the derivation modes and picking strategies as wallet-btc does", () => {
    expect(toBitcoinDerivationMode("segwit")).toBe("SegWit");
    expect(BITCOIN_PICKING_STRATEGY).toEqual({
      DEEP_OUTPUTS_FIRST: 0,
      OPTIMIZE_SIZE: 1,
      MERGE_OUTPUTS: 2,
      CUSTOM: 3,
    });
  });
});
