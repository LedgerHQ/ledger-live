/**
 * Unit tests for the createApi factory — verifies the coin config is set, every method the chain
 * supports is wired and delegates to its logic function with the right arguments, the omitted
 * capabilities are absent from the authored object, and they answer "not supported" once the
 * framework's `withDefaults` (the wrapper the resolver applies) has backfilled them. Network and
 * logic layers are mocked; no network access.
 */
import type {
  Balance,
  BalanceOptions,
  CraftedTransaction,
  FeeEstimation,
  Operation,
  Page,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { createApi } from "./index";
import { getCoinConfig, setCoinConfig, type VechainCurrencyConfig } from "../config";
import { createMockVechainContext } from "../test/context";
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

const config = () => ({
  status: { type: "active" as const },
  node: { url: "https://vechain.coin.ledger.com" },
});

const SENDER = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";
const RECIPIENT = "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86";

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

  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(createApi(), createMockVechainContext())).resolves.toEqual({
      unsupported: [
        "call",
        "craftRawTransaction",
        "getNextSequence",
        "getRewards",
        "getStakes",
        "getValidators",
        "register",
      ],
      inconsistent: [],
    });
  });
  it("exposes the coin config through the singleton", () => {
    setCoinConfig(config);

    expect(getCoinConfig()).toEqual({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
    });
  });

  it("declares every method the chain supports", () => {
    const api = createApi();

    expect(api).toEqual(
      expect.objectContaining({
        broadcast: expect.any(Function),
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        craftTransactionData: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: expect.any(Function),
        lastBlock: expect.any(Function),
        listOperations: expect.any(Function),
        getBlock: expect.any(Function),
        getBlockInfo: expect.any(Function),
        validateIntent: expect.any(Function),
        validateAddress: expect.any(Function),
      }),
    );
  });

  it("delegates broadcast to the logic function", async () => {
    jest.mocked(broadcast).mockResolvedValueOnce("txHash");
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.broadcast(context, "signedTx");

    expect(broadcast).toHaveBeenCalledWith(context, "signedTx", undefined);
    expect(result).toBe("txHash");
  });

  it("delegates combine to the logic function", () => {
    jest.mocked(combine).mockReturnValueOnce("0xsigned");
    const api = createApi();
    const context = createMockVechainContext();

    const result = api.combine(context, "tx", ["sig"]);

    expect(combine).toHaveBeenCalledWith("tx", ["sig"]);
    expect(result).toBe("0xsigned");
  });

  it("delegates craftTransaction to the logic function (intent, customFees)", async () => {
    const crafted: CraftedTransaction = { transaction: "{}", details: { fee: "1000" } };
    jest.mocked(craftTransaction).mockResolvedValueOnce(crafted);
    const api = createApi();
    const context = createMockVechainContext();
    const customFees: FeeEstimation = { value: 5000n };

    const result = await api.craftTransaction(context, nativeIntent, { customFees });

    expect(craftTransaction).toHaveBeenCalledWith(context, nativeIntent, customFees);
    expect(result).toEqual(crafted);
  });

  it("delegates estimateFees to the logic function (intent, params)", async () => {
    const fees: FeeEstimation = { value: 1000n };
    jest.mocked(estimateFees).mockResolvedValueOnce(fees);
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.estimateFees(context, nativeIntent);

    expect(estimateFees).toHaveBeenCalledWith(context, nativeIntent, undefined);
    expect(result).toEqual(fees);
  });

  it("delegates getBalance to the logic function (address)", async () => {
    const balances: Balance[] = [{ value: 1000n, asset: { type: "native" } }];
    jest.mocked(getBalance).mockResolvedValueOnce(balances);
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.getBalance(context, SENDER);

    expect(getBalance).toHaveBeenCalledWith(context, SENDER);
    expect(result).toEqual(balances);
  });

  it("rejects getBalance when options are provided (not supported)", async () => {
    const api = createApi();
    const context = createMockVechainContext();

    await expect(api.getBalance(context, SENDER, {} as BalanceOptions)).rejects.toThrow();
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("delegates lastBlock to the logic function", async () => {
    const block = { height: 100, hash: "abc", time: new Date() };
    jest.mocked(lastBlock).mockResolvedValueOnce(block);
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.lastBlock(context);

    expect(lastBlock).toHaveBeenCalled();
    expect(result).toEqual(block);
  });

  it("delegates getBlockInfo to the logic function (height)", async () => {
    const info = { height: 42, hash: "abc", time: new Date() };
    jest.mocked(getBlockInfo).mockResolvedValueOnce(info);
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.getBlockInfo(context, 42);

    expect(getBlockInfo).toHaveBeenCalledWith(context, 42);
    expect(result).toEqual(info);
  });

  it("delegates getBlock to the logic function (height)", async () => {
    const block = { info: { height: 42, hash: "abc", time: new Date() }, transactions: [] };
    jest.mocked(getBlock).mockResolvedValueOnce(block);
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.getBlock(context, 42);

    expect(getBlock).toHaveBeenCalledWith(context, 42);
    expect(result).toEqual(block);
  });

  it("delegates listOperations to the logic function (address, options)", async () => {
    const page: Page<Operation> = { items: [], next: undefined };
    jest.mocked(listOperations).mockResolvedValueOnce(page);
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.listOperations(context, SENDER, { minHeight: 0 });

    expect(listOperations).toHaveBeenCalledWith(context, SENDER, { minHeight: 0 });
    expect(result).toEqual(page);
  });

  it("delegates validateIntent to the logic function (intent, balances, customFees)", async () => {
    const validation = { errors: {}, warnings: {}, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    jest.mocked(validateIntent).mockResolvedValueOnce(validation);
    const api = createApi();
    const context = createMockVechainContext();

    const result = await api.validateIntent(context, nativeIntent, [], undefined);

    expect(validateIntent).toHaveBeenCalledWith(nativeIntent, [], undefined);
    expect(result).toEqual(validation);
  });

  it("validates addresses via parseAddress", async () => {
    const api = createApi();
    const context = createMockVechainContext();
    await expect(api.validateAddress(context, SENDER, {})).resolves.toBe(true);
    await expect(api.validateAddress(context, "0xnot-an-address", {})).resolves.toBe(false);
    await expect(api.validateAddress(context, "", {})).resolves.toBe(false);
  });
});
