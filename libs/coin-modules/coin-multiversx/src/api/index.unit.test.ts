/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * Unit tests for the createApi factory — verifies the coin config is set, every
 * CoinModuleApi method is wired and delegates to its logic function with the
 * right arguments, and unsupported methods throw synchronously. Network and
 * logic layers are mocked; no network access.
 */
import type {
  Balance,
  BalanceOptions,
  CoinModuleApi,
  CraftedTransaction,
  FeeEstimation,
  Operation,
  Page,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/errors";
import { createApi } from "./index";
import coinConfig, { type MultiversXCoinConfig } from "../config";
import type { MultiversXNetworkApi } from "../network/api";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { getBalance } from "../logic/account/getBalance";
import { getNextSequence } from "../logic/account/getNextSequence";
import { getStakes } from "../logic/staking/getStakes";
import { getValidators } from "../logic/staking/getValidators";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

const mockNetworkApi = {} as unknown as MultiversXNetworkApi;

jest.mock("../network/api", () => ({
  createNetworkApi: () => mockNetworkApi,
}));

jest.mock("../logic/transaction/broadcast", () => ({ broadcast: jest.fn() }));
jest.mock("../logic/transaction/combine", () => ({ combine: jest.fn() }));
jest.mock("../logic/transaction/craftTransaction", () => ({ craftTransaction: jest.fn() }));
jest.mock("../logic/transaction/estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../logic/account/getBalance", () => ({ getBalance: jest.fn() }));
jest.mock("../logic/account/getNextSequence", () => ({ getNextSequence: jest.fn() }));
jest.mock("../logic/staking/getStakes", () => ({ getStakes: jest.fn() }));
jest.mock("../logic/staking/getValidators", () => ({ getValidators: jest.fn() }));
jest.mock("../logic/history/lastBlock", () => ({ lastBlock: jest.fn() }));
jest.mock("../logic/history/listOperations", () => ({ listOperations: jest.fn() }));
jest.mock("../logic/validateAddress", () => ({ validateAddress: jest.fn() }));
jest.mock("../logic/validateIntent", () => ({ validateIntent: jest.fn() }));

const config: MultiversXCoinConfig = {
  status: { type: "active" },
  apiEndpoint: "https://api.multiversx.com",
  delegationApiEndpoint: "https://delegation-api.multiversx.com",
};

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

const nativeIntent: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
  amount: 1000000000000000000n,
  asset: { type: "native" },
};

describe("createApi", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sets the coin config, forcing status active", () => {
    const setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(config, "elrond");

    expect(setCoinConfigSpy).toHaveBeenCalled();
    const resolved = setCoinConfigSpy.mock.calls[0][0]();
    expect(resolved).toEqual(expect.objectContaining({ ...config, status: { type: "active" } }));
  });

  it("returns an object with every CoinModuleApi method", () => {
    const api = createApi(config, "elrond");

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

  it("delegates broadcast to the logic function (network api, tx)", async () => {
    jest.mocked(broadcast).mockResolvedValueOnce("txHash");
    const api = createApi(config, "elrond");

    const result = await api.broadcast("transaction");

    expect(broadcast).toHaveBeenCalledWith(mockNetworkApi, "transaction");
    expect(result).toBe("txHash");
  });

  it("delegates combine to the logic function (tx, signature, pubkey)", () => {
    jest.mocked(combine).mockReturnValueOnce("signedTx");
    const api = createApi(config, "elrond");

    const result = api.combine("transaction", "signature");

    expect(combine).toHaveBeenCalledWith("transaction", "signature", undefined);
    expect(result).toBe("signedTx");
  });

  it("delegates craftTransaction to the logic function (network api, intent, customFees)", async () => {
    const crafted: CraftedTransaction = {
      transaction: "json",
      details: { gasLimit: 50000, estimatedFee: "50000000000000" },
    };
    jest.mocked(craftTransaction).mockResolvedValueOnce(crafted);
    const api = createApi(config, "elrond");
    const customFees: FeeEstimation = { value: 5n };

    const result = await api.craftTransaction(nativeIntent, customFees);

    expect(craftTransaction).toHaveBeenCalledWith(mockNetworkApi, nativeIntent, customFees);
    expect(result).toEqual(crafted);
  });

  it("delegates estimateFees to the logic function (intent, params — no network api)", async () => {
    const fees: FeeEstimation = { value: 50000000000000n };
    jest.mocked(estimateFees).mockResolvedValueOnce(fees);
    const api = createApi(config, "elrond");

    const result = await api.estimateFees(nativeIntent);

    expect(estimateFees).toHaveBeenCalledWith(nativeIntent, undefined);
    expect(result).toEqual(fees);
  });

  it("delegates getBalance to the logic function (network api, address)", async () => {
    const balances: Balance[] = [{ value: 1000n, asset: { type: "native" } }];
    jest.mocked(getBalance).mockResolvedValueOnce(balances);
    const api = createApi(config, "elrond");

    const result = await api.getBalance("address");

    expect(getBalance).toHaveBeenCalledWith(mockNetworkApi, "address");
    expect(result).toEqual(balances);
  });

  it("rejects getBalance when the options parameter is provided", async () => {
    const api = createApi(config, "elrond");

    await expect(api.getBalance("address", {} as unknown as BalanceOptions)).rejects.toThrow(
      InvalidParameterError,
    );
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("delegates lastBlock to the logic function (network api)", async () => {
    const block = { height: 100, hash: "hash", time: new Date() };
    jest.mocked(lastBlock).mockResolvedValueOnce(block);
    const api = createApi(config, "elrond");

    const result = await api.lastBlock();

    expect(lastBlock).toHaveBeenCalledWith(mockNetworkApi);
    expect(result).toEqual(block);
  });

  it("delegates listOperations to the logic function (network api, address, options)", async () => {
    const page: Page<Operation> = { items: [], next: undefined };
    jest.mocked(listOperations).mockResolvedValueOnce(page);
    const api = createApi(config, "elrond");

    const result = await api.listOperations("address", { minHeight: 14, order: "asc" });

    expect(listOperations).toHaveBeenCalledWith(mockNetworkApi, "address", {
      minHeight: 14,
      order: "asc",
    });
    expect(result).toEqual(page);
  });

  it("delegates getStakes to the logic function (network api, address, cursor)", async () => {
    const page = { items: [], next: undefined };
    jest.mocked(getStakes).mockResolvedValueOnce(page);
    const api = createApi(config, "elrond");

    const result = await api.getStakes("address");

    expect(getStakes).toHaveBeenCalledWith(mockNetworkApi, "address", undefined);
    expect(result).toEqual(page);
  });

  it("delegates getValidators to the logic function (network api, cursor)", async () => {
    const page = { items: [], next: undefined };
    jest.mocked(getValidators).mockResolvedValueOnce(page);
    const api = createApi(config, "elrond");

    const result = await api.getValidators();

    expect(getValidators).toHaveBeenCalledWith(mockNetworkApi, undefined);
    expect(result).toEqual(page);
  });

  it("delegates validateIntent to the logic function (intent, balances, customFees — no network api)", async () => {
    const validation = {
      errors: {},
      warnings: {},
      estimatedFees: 0n,
      amount: 0n,
      totalSpent: 0n,
    };
    jest.mocked(validateIntent).mockResolvedValueOnce(validation);
    const api = createApi(config, "elrond");

    const result = await api.validateIntent(nativeIntent, [], undefined);

    expect(validateIntent).toHaveBeenCalledWith(nativeIntent, [], undefined);
    expect(result).toEqual(validation);
  });

  it("delegates getNextSequence to the logic function (network api, address)", async () => {
    jest.mocked(getNextSequence).mockResolvedValueOnce(42n);
    const api = createApi(config, "elrond");

    const result = await api.getNextSequence("address");

    expect(getNextSequence).toHaveBeenCalledWith(mockNetworkApi, "address");
    expect(result).toBe(42n);
  });

  it("delegates validateAddress to the logic function (address, parameters — no network api)", async () => {
    jest.mocked(validateAddress).mockResolvedValueOnce(true);
    const api = createApi(config, "elrond");

    const result = await api.validateAddress("address", {});

    expect(validateAddress).toHaveBeenCalledWith("address", {});
    expect(result).toBe(true);
  });

  it("throws for unsupported methods", () => {
    const api = createApi(config, "elrond");

    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
    expect(() => api.getBlockInfo(1)).toThrow("getBlockInfo is not supported");
    expect(() => (api as CoinModuleApi).getRewards(SENDER)).toThrow("getRewards is not supported");
    expect(() => api.craftRawTransaction("tx", SENDER, "pubkey", 1n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });
});
