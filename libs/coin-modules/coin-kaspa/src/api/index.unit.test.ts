/**
 * Unit tests for the createApi factory — verifies the coin config is set, every
 * CoinModuleApi method is wired and delegates to its logic function with the
 * right arguments, and unsupported methods throw synchronously. Network and
 * logic layers are mocked; no network access.
 */
import type {
  Balance,
  CoinModuleApi,
  CraftedTransaction,
  FeeEstimation,
  Operation,
  Page,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from "./index";
import coinConfig, { type KaspaCoinConfig } from "../config";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { getBalance } from "../logic/account/getBalance";
import { getBlock } from "../logic/history/getBlock";
import { getBlockInfo } from "../logic/history/getBlockInfo";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { validateIntent } from "../logic/validateIntent";

jest.mock("../logic/transaction/broadcast", () => ({ broadcast: jest.fn() }));
jest.mock("../logic/transaction/combine", () => ({ combine: jest.fn() }));
jest.mock("../logic/transaction/craftTransaction", () => ({ craftTransaction: jest.fn() }));
jest.mock("../logic/transaction/estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../logic/account/getBalance", () => ({ getBalance: jest.fn() }));
jest.mock("../logic/history/getBlock", () => ({ getBlock: jest.fn() }));
jest.mock("../logic/history/getBlockInfo", () => ({ getBlockInfo: jest.fn() }));
jest.mock("../logic/history/lastBlock", () => ({ lastBlock: jest.fn() }));
jest.mock("../logic/history/listOperations", () => ({ listOperations: jest.fn() }));
jest.mock("../logic/validateIntent", () => ({ validateIntent: jest.fn() }));

const config: KaspaCoinConfig = { status: { type: "active" } };

const SENDER = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";
const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

const nativeIntent: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 100_000_000n,
  asset: { type: "native" },
};

describe("createApi", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sets the coin config, forcing status active", () => {
    const setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(config, "kaspa");

    expect(setCoinConfigSpy).toHaveBeenCalled();
    const resolved = setCoinConfigSpy.mock.calls[0][0]();
    expect(resolved).toEqual(expect.objectContaining({ ...config, status: { type: "active" } }));
  });

  it("returns an object with every CoinModuleApi method", () => {
    const api = createApi(config, "kaspa");

    expect(api).toEqual(
      expect.objectContaining({
        broadcast: expect.any(Function),
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        craftRawTransaction: expect.any(Function),
        craftTransactionData: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: expect.any(Function),
        lastBlock: expect.any(Function),
        listOperations: expect.any(Function),
        getBlock: expect.any(Function),
        getBlockInfo: expect.any(Function),
        getRewards: expect.any(Function),
        getStakes: expect.any(Function),
        getValidators: expect.any(Function),
        validateIntent: expect.any(Function),
        getNextSequence: expect.any(Function),
        validateAddress: expect.any(Function),
      }),
    );
  });

  it("delegates broadcast to the logic function", async () => {
    jest.mocked(broadcast).mockResolvedValueOnce("txHash");
    const api = createApi(config, "kaspa");

    const result = await api.broadcast("signedTx");

    expect(broadcast).toHaveBeenCalledWith("signedTx", undefined);
    expect(result).toBe("txHash");
  });

  it("delegates combine to the logic function", () => {
    jest.mocked(combine).mockReturnValueOnce("signedTx");
    const api = createApi(config, "kaspa");

    const result = api.combine("tx", "sigs");

    expect(combine).toHaveBeenCalledWith("tx", "sigs");
    expect(result).toBe("signedTx");
  });

  it("delegates craftTransaction to the logic function (intent, customFees)", async () => {
    const crafted: CraftedTransaction = { transaction: "{}", details: { fee: "1000" } };
    jest.mocked(craftTransaction).mockResolvedValueOnce(crafted);
    const api = createApi(config, "kaspa");
    const customFees: FeeEstimation = { value: 5000n };

    const result = await api.craftTransaction(nativeIntent, customFees);

    expect(craftTransaction).toHaveBeenCalledWith(nativeIntent, customFees);
    expect(result).toEqual(crafted);
  });

  it("delegates estimateFees to the logic function (intent, params)", async () => {
    const fees: FeeEstimation = { value: 1000n };
    jest.mocked(estimateFees).mockResolvedValueOnce(fees);
    const api = createApi(config, "kaspa");

    const result = await api.estimateFees(nativeIntent);

    expect(estimateFees).toHaveBeenCalledWith(nativeIntent, undefined);
    expect(result).toEqual(fees);
  });

  it("delegates getBalance to the logic function (address)", async () => {
    const balances: Balance[] = [{ value: 1000n, asset: { type: "native" } }];
    jest.mocked(getBalance).mockResolvedValueOnce(balances);
    const api = createApi(config, "kaspa");

    const result = await api.getBalance(SENDER);

    expect(getBalance).toHaveBeenCalledWith(SENDER);
    expect(result).toEqual(balances);
  });

  it("rejects getBalance when options are provided (not supported for UTXO chains)", async () => {
    const api = createApi(config, "kaspa");

    await expect(
      api.getBalance(SENDER, {} as Parameters<CoinModuleApi["getBalance"]>[1]),
    ).rejects.toThrow();
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("delegates lastBlock to the logic function", async () => {
    const block = { height: 100, hash: "abc", time: new Date() };
    jest.mocked(lastBlock).mockResolvedValueOnce(block);
    const api = createApi(config, "kaspa");

    const result = await api.lastBlock();

    expect(lastBlock).toHaveBeenCalled();
    expect(result).toEqual(block);
  });

  it("delegates getBlockInfo to the logic function (height)", async () => {
    const info = { height: 42, hash: "abc", time: new Date() };
    jest.mocked(getBlockInfo).mockResolvedValueOnce(info);
    const api = createApi(config, "kaspa");

    const result = await api.getBlockInfo(42);

    expect(getBlockInfo).toHaveBeenCalledWith(42);
    expect(result).toEqual(info);
  });

  it("delegates getBlock to the logic function (height)", async () => {
    const block = { info: { height: 42, hash: "abc", time: new Date() }, transactions: [] };
    jest.mocked(getBlock).mockResolvedValueOnce(block);
    const api = createApi(config, "kaspa");

    const result = await api.getBlock(42);

    expect(getBlock).toHaveBeenCalledWith(42);
    expect(result).toEqual(block);
  });

  it("delegates listOperations to the logic function (address, options)", async () => {
    const page: Page<Operation> = { items: [], next: undefined };
    jest.mocked(listOperations).mockResolvedValueOnce(page);
    const api = createApi(config, "kaspa");

    const result = await api.listOperations(SENDER, { minHeight: 0 });

    expect(listOperations).toHaveBeenCalledWith(SENDER, { minHeight: 0 });
    expect(result).toEqual(page);
  });

  it("delegates validateIntent to the logic function (intent, balances, customFees)", async () => {
    const validation = { errors: {}, warnings: {}, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    jest.mocked(validateIntent).mockResolvedValueOnce(validation);
    const api = createApi(config, "kaspa");

    const result = await api.validateIntent(nativeIntent, [], undefined);

    expect(validateIntent).toHaveBeenCalledWith(nativeIntent, [], undefined);
    expect(result).toEqual(validation);
  });

  it("throws synchronously for methods not applicable to Kaspa's UTXO model", () => {
    const api = createApi(config, "kaspa");

    expect(() => api.getNextSequence(SENDER)).toThrow(
      "getNextSequence is not applicable for Kaspa",
    );
    expect(() => api.craftRawTransaction("raw", SENDER, "pubkey", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
    expect(() => api.validateAddress(SENDER, {})).toThrow("validateAddress is not supported");
    expect(() => api.getStakes(SENDER)).toThrow("getStakes is not supported");
    expect(() => api.getRewards(SENDER)).toThrow("getRewards is not supported");
    expect(() => api.getValidators()).toThrow("getValidators is not supported");
  });
});
