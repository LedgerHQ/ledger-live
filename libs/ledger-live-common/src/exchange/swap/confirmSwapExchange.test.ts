import BigNumber from "bignumber.js";
import { NEVER, of, throwError } from "rxjs";
import { createExchange } from "@ledgerhq/hw-app-exchange";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/ReturnCode";
import type Transport from "@ledgerhq/hw-transport";
import { DeviceDisconnectedWhileSendingError } from "@ledgerhq/device-management-kit";
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../../coin-modules/transaction-types";
import { getAccountBridge } from "../../bridge";
import { getMainAccount } from "../../account";
import { getCurrencyExchangeConfig } from "../";
import { getIsSwapSignatureVerificationError } from "../error";
import { getSwapProvider } from "../providers";
import {
  confirmSwapExchange,
  FEE_RESYNC_TIMEOUT_MS,
  type ConfirmSwapExchangeInput,
} from "./completeExchange";

// `ExchangeTypes` is a const enum: tsc inlines it, but jest has to be given its values.
jest.mock("@ledgerhq/hw-app-exchange", () => ({
  ...jest.requireActual("@ledgerhq/hw-app-exchange"),
  createExchange: jest.fn(),
  ExchangeTypes: { Swap: 0, Sell: 1, Fund: 2, SwapNg: 3, SellNg: 4, FundNg: 5 },
}));
jest.mock("../../account", () => ({
  getMainAccount: jest.fn(),
  getAccountCurrency: jest.fn((account: Account) => account.currency),
}));
jest.mock("../../bridge", () => ({ getAccountBridge: jest.fn() }));
jest.mock("../../hw/deviceAccess", () => ({ withDevicePromise: jest.fn() }));
jest.mock("../providers", () => ({
  getSwapProvider: jest.fn(),
  convertToAppExchangePartnerKey: jest.fn(() => ({ name: "partner" })),
}));
jest.mock("../", () => ({
  getCurrencyExchangeConfig: jest.fn(() =>
    Promise.resolve({ config: Buffer.from("01", "hex"), signature: Buffer.from("02", "hex") }),
  ),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn(() => Promise.resolve(false)),
}));

const SWAP = 0;

const transport = { id: "transport" } as unknown as Transport;
const bitcoin = getCryptoCurrencyById("bitcoin");
const litecoin = getCryptoCurrencyById("litecoin");
const fromAccount = {
  type: "Account",
  id: "from",
  currency: bitcoin,
  freshAddress: "from-address",
  balance: new BigNumber(10),
  spendableBalance: new BigNumber(10),
  pendingOperations: [],
} as unknown as Account;
const toAccount = {
  type: "Account",
  id: "to",
  currency: litecoin,
  freshAddress: "to-address",
} as unknown as Account;
const transaction = { family: "bitcoin", amount: new BigNumber(1) } as Transaction;
const preparedTransaction = { ...transaction, prepared: true } as unknown as Transaction;

const input: ConfirmSwapExchangeInput = {
  exchangeType: SWAP,
  provider: "changelly",
  exchange: {
    fromAccount,
    fromParentAccount: undefined,
    fromCurrency: bitcoin,
    toAccount,
    toParentAccount: undefined,
    toCurrency: litecoin,
  },
  transaction,
  binaryPayload: "0a0b",
  // A 64 byte compact signature, which the device expects in DER.
  signature: "11".repeat(64),
} as unknown as ConfirmSwapExchangeInput;

function createExchangeApp(overrides: Record<string, jest.Mock> = {}) {
  return {
    transactionType: SWAP,
    setPartnerKey: jest.fn().mockResolvedValue(undefined),
    checkPartner: jest.fn().mockResolvedValue(undefined),
    processTransaction: jest.fn().mockResolvedValue(undefined),
    checkTransactionSignature: jest.fn().mockResolvedValue(undefined),
    validatePayoutOrAsset: jest.fn().mockResolvedValue(undefined),
    checkRefundAddress: jest.fn().mockResolvedValue(undefined),
    signCoinTransaction: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/** A bridge `sync` that emits one update replacing the account with `account`. */
const syncTo = (account: Account) => jest.fn(() => of(() => account));

function run(callbacks: Partial<Parameters<typeof confirmSwapExchange>[1]> = {}) {
  return confirmSwapExchange(input, {
    transport,
    isCancelled: () => false,
    onConfirmationRequested: jest.fn(),
    ...callbacks,
  });
}

describe("confirmSwapExchange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getMainAccount).mockImplementation(account => account as Account);
    jest.mocked(getSwapProvider).mockResolvedValue({
      version: 1,
      signature: Buffer.from("aa", "hex"),
    } as never);
    jest.mocked(getAccountBridge).mockResolvedValue({
      prepareTransaction: jest.fn().mockResolvedValue(preparedTransaction),
      getTransactionStatus: jest
        .fn()
        .mockResolvedValue({ errors: {}, estimatedFees: new BigNumber(7) }),
      getSerializedAddressParameters: jest.fn(() => Buffer.from("03", "hex")),
    } as unknown as Awaited<ReturnType<typeof getAccountBridge>>);
  });

  it("confirms the swap on the device and resolves with the prepared transaction", async () => {
    const exchangeApp = createExchangeApp();
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
    const onConfirmationRequested = jest.fn();

    await expect(run({ onConfirmationRequested })).resolves.toBe(preparedTransaction);

    expect(createExchange).toHaveBeenCalledWith(transport, SWAP, undefined, 1);
    expect(exchangeApp.checkRefundAddress).toHaveBeenCalledTimes(1);
    expect(onConfirmationRequested).toHaveBeenCalledWith("7");
    expect(exchangeApp.signCoinTransaction).toHaveBeenCalledTimes(1);
  });

  it("treats a transport error from signCoinTransaction as the hand-over to the coin app", async () => {
    const exchangeApp = createExchangeApp({
      signCoinTransaction: jest.fn().mockRejectedValue(new Error("device went away")),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    await expect(run()).resolves.toBe(preparedTransaction);
  });

  it("reports a user refusal on the device as TransactionRefusedOnDevice", async () => {
    const exchangeApp = createExchangeApp({
      processTransaction: jest.fn().mockRejectedValue(new TransportStatusError(0x6a84)),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    await expect(run()).rejects.toMatchObject({ name: "TransactionRefusedOnDevice" });
  });

  it("names a DMK error of the session after its tag", async () => {
    const exchangeApp = createExchangeApp({
      processTransaction: jest.fn().mockRejectedValue(new DeviceDisconnectedWhileSendingError()),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    await expect(run()).rejects.toMatchObject({ name: "DeviceDisconnectedWhileSendingError" });
  });

  it("recognises a provider signature the Exchange app rejects, which executeSwap retries", async () => {
    const exchangeApp = createExchangeApp({
      checkTransactionSignature: jest
        .fn()
        .mockRejectedValue(new TransportStatusError(ErrorStatus.SIGN_VERIFICATION_FAIL)),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    const error = await run().catch((e: unknown) => e);

    expect(getIsSwapSignatureVerificationError(error)).toBe(true);
    expect(exchangeApp.signCoinTransaction).not.toHaveBeenCalled();
  });

  it("refuses a provider the Exchange app cannot handle", async () => {
    jest
      .mocked(getSwapProvider)
      .mockResolvedValue({ useInExchangeApp: false, type: "DEX" } as never);

    await expect(run()).rejects.toThrow("Unsupported provider type DEX");
    expect(createExchange).not.toHaveBeenCalled();
  });

  it("stops sending to the device once cancelled", async () => {
    const exchangeApp = createExchangeApp();
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
    let cancelled = false;
    exchangeApp.setPartnerKey.mockImplementation(async () => {
      cancelled = true;
    });

    await run({ isCancelled: () => cancelled });

    expect(exchangeApp.checkPartner).not.toHaveBeenCalled();
    expect(exchangeApp.signCoinTransaction).not.toHaveBeenCalled();
  });

  it("does not check the payout address once cancelled during its config lookup", async () => {
    const exchangeApp = createExchangeApp();
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
    let cancelled = false;
    jest.mocked(getCurrencyExchangeConfig).mockImplementationOnce(async () => {
      cancelled = true;
      return { config: Buffer.from("01", "hex"), signature: Buffer.from("02", "hex") };
    });

    await run({ isCancelled: () => cancelled });

    expect(exchangeApp.validatePayoutOrAsset).not.toHaveBeenCalled();
  });

  describe("TRON fee shortfall", () => {
    const tron = getCryptoCurrencyById("tron");
    const staleTronAccount = {
      ...fromAccount,
      id: "tron-from",
      currency: tron,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      pendingOperations: [{ id: "unconfirmed" }],
      subAccounts: [{ id: "usdt", pendingOperations: [{ id: "unconfirmed-usdt" }] }],
    } as unknown as Account;
    // What a from-scratch sync returns: fresh balances, but no pending operations.
    const syncedTronAccount = {
      ...staleTronAccount,
      balance: new BigNumber(800_000),
      spendableBalance: new BigNumber(700_000),
      pendingOperations: [],
      subAccounts: [{ id: "usdt", pendingOperations: [] }],
    } as unknown as Account;
    const validatedTronAccount = {
      ...staleTronAccount,
      balance: new BigNumber(800_000),
      spendableBalance: new BigNumber(700_000),
    } as unknown as Account;
    const tronTransaction = { family: "tron", amount: new BigNumber(1) } as Transaction;
    const preparedOnStale = { ...tronTransaction, preparedOn: "stale" } as unknown as Transaction;
    const preparedOnSynced = { ...tronTransaction, preparedOn: "synced" } as unknown as Transaction;
    const tronInput = {
      ...input,
      exchange: { ...input.exchange, fromAccount: staleTronAccount, fromCurrency: tron },
      transaction: tronTransaction,
    } as unknown as ConfirmSwapExchangeInput;
    const notEnoughGas = {
      errors: { gasLimit: new Error("NotEnoughGas") },
      estimatedFees: new BigNumber(350_000),
    };
    const noError = { errors: {}, estimatedFees: new BigNumber(350_000) };

    function mockBridge(statuses: object[], sync: jest.Mock) {
      const bridge = {
        prepareTransaction: jest
          .fn()
          .mockImplementation(async (account: Account) =>
            account.balance.isZero() ? preparedOnStale : preparedOnSynced,
          ),
        getTransactionStatus: jest.fn(),
        getSerializedAddressParameters: jest.fn(() => Buffer.from("03", "hex")),
        sync,
      };
      for (const status of statuses) bridge.getTransactionStatus.mockResolvedValueOnce(status);
      jest
        .mocked(getAccountBridge)
        .mockResolvedValue(bridge as unknown as Awaited<ReturnType<typeof getAccountBridge>>);
      return bridge;
    }

    function runTron() {
      return confirmSwapExchange(tronInput, {
        transport,
        isCancelled: () => false,
        onConfirmationRequested: jest.fn(),
      });
    }

    it("validates again with the synced native balances, and signs what was prepared", async () => {
      const exchangeApp = createExchangeApp();
      jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
      const sync = syncTo(syncedTronAccount);
      const bridge = mockBridge([notEnoughGas, noError], sync);

      await expect(runTron()).resolves.toBe(preparedOnSynced);

      expect(sync).toHaveBeenCalledWith(staleTronAccount, { paginationConfig: {} });
      expect(bridge.getTransactionStatus).toHaveBeenNthCalledWith(
        2,
        validatedTronAccount,
        preparedOnSynced,
      );
      expect(exchangeApp.signCoinTransaction).toHaveBeenCalledTimes(1);
    });

    it("still aborts when the synced balance is short too", async () => {
      const exchangeApp = createExchangeApp();
      jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
      const bridge = mockBridge([notEnoughGas, notEnoughGas], syncTo(syncedTronAccount));

      await expect(runTron()).rejects.toThrow("NotEnoughGas");

      expect(bridge.getTransactionStatus).toHaveBeenCalledTimes(2);
      expect(exchangeApp.setPartnerKey).not.toHaveBeenCalled();
    });

    it("keeps the original shortfall when the sync fails", async () => {
      const exchangeApp = createExchangeApp();
      jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
      const bridge = mockBridge(
        [notEnoughGas],
        jest.fn(() => throwError(() => new Error("network down"))),
      );

      await expect(runTron()).rejects.toThrow("NotEnoughGas");

      expect(bridge.getTransactionStatus).toHaveBeenCalledTimes(1);
      expect(exchangeApp.setPartnerKey).not.toHaveBeenCalled();
    });

    it("keeps the original shortfall when the sync exceeds its deadline", async () => {
      jest.useFakeTimers();
      try {
        const exchangeApp = createExchangeApp();
        jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
        const bridge = mockBridge(
          [notEnoughGas],
          jest.fn(() => NEVER),
        );

        const result = runTron().catch((e: unknown) => e);
        await jest.advanceTimersByTimeAsync(FEE_RESYNC_TIMEOUT_MS);

        await expect(result).resolves.toMatchObject({ message: "NotEnoughGas" });
        expect(bridge.getTransactionStatus).toHaveBeenCalledTimes(1);
        expect(exchangeApp.setPartnerKey).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it("does not sync for an error other than a fee shortfall", async () => {
      jest.mocked(createExchange).mockReturnValue(createExchangeApp() as never);
      const sync = syncTo(syncedTronAccount);
      mockBridge(
        [{ errors: { amount: new Error("NotEnoughBalance") }, estimatedFees: new BigNumber(0) }],
        sync,
      );

      await expect(runTron()).rejects.toThrow("NotEnoughBalance");

      expect(sync).not.toHaveBeenCalled();
    });

    it("does not sync for a fee shortfall on another family", async () => {
      jest.mocked(createExchange).mockReturnValue(createExchangeApp() as never);
      const sync = syncTo(fromAccount);
      mockBridge([notEnoughGas], sync);

      await expect(run()).rejects.toThrow("NotEnoughGas");

      expect(sync).not.toHaveBeenCalled();
    });
  });

  it("reports a rejection of the review as a userRefused error of the refund check", async () => {
    const exchangeApp = createExchangeApp({
      checkRefundAddress: jest.fn().mockRejectedValue(new TransportStatusError(0x6a84)),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    await expect(run()).rejects.toMatchObject({
      name: "CompleteExchangeError",
      step: "CHECK_REFUND_ADDRESS",
      title: "userRefused",
    });
  });
});
