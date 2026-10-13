import BigNumber from "bignumber.js";
import { createExchange } from "@ledgerhq/hw-app-exchange";
import type Transport from "@ledgerhq/hw-transport";
import { DeviceDisconnectedWhileSendingError } from "@ledgerhq/device-management-kit";
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../../../coin-modules/transaction-types";
import { getAccountBridge } from "../../../bridge";
import { getMainAccount } from "../../../account";
import { getCurrencyExchangeConfig } from "../..";
import { CompleteExchangeError } from "../../error";
import type { CompleteExchangeInputSell } from "../types";
import { confirmTransferExchange } from "./completeExchange";

// `ExchangeTypes` is a const enum: tsc inlines it, but jest has to be given its values.
jest.mock("@ledgerhq/hw-app-exchange", () => ({
  ...jest.requireActual("@ledgerhq/hw-app-exchange"),
  createExchange: jest.fn(),
  ExchangeTypes: { Swap: 0, Sell: 1, Fund: 2, SwapNg: 3, SellNg: 4, FundNg: 5 },
}));
jest.mock("../../../account", () => ({
  getMainAccount: jest.fn(),
  getAccountCurrency: jest.fn((account: Account) => account.currency),
}));
jest.mock("../../../bridge", () => ({ getAccountBridge: jest.fn() }));
jest.mock("../../../hw/deviceAccess", () => ({ withDevice: jest.fn() }));
jest.mock("../../providers", () => ({
  getProviderConfig: jest.fn(() =>
    Promise.resolve({ version: 1, signature: Buffer.from("aa", "hex") }),
  ),
  convertToAppExchangePartnerKey: jest.fn(() => ({ name: "partner" })),
}));
jest.mock("../..", () => ({
  getCurrencyExchangeConfig: jest.fn(() =>
    Promise.resolve({ config: Buffer.from("01", "hex"), signature: Buffer.from("02", "hex") }),
  ),
}));

const SELL = 1;

const transport = { id: "transport" } as unknown as Transport;
const bitcoin = getCryptoCurrencyById("bitcoin");
const fromAccount = { type: "Account", id: "from", currency: bitcoin } as Account;
const transaction = { family: "bitcoin", amount: new BigNumber(1) } as Transaction;
const preparedTransaction = { ...transaction, prepared: true } as unknown as Transaction;

const input: CompleteExchangeInputSell = {
  exchangeType: SELL,
  provider: "coinify",
  exchange: { fromAccount, fromParentAccount: undefined, fromCurrency: bitcoin },
  transaction,
  binaryPayload: "0a0b",
  signature: "0c0d",
} as unknown as CompleteExchangeInputSell;

function createExchangeApp(overrides: Record<string, jest.Mock> = {}) {
  return {
    transactionType: SELL,
    setPartnerKey: jest.fn().mockResolvedValue(undefined),
    checkPartner: jest.fn().mockResolvedValue(undefined),
    processTransaction: jest.fn().mockResolvedValue(undefined),
    checkTransactionSignature: jest.fn().mockResolvedValue(undefined),
    validatePayoutOrAsset: jest.fn().mockResolvedValue(undefined),
    signCoinTransaction: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockBridge({ errors = {} }: { errors?: Record<string, Error> } = {}) {
  jest.mocked(getAccountBridge).mockResolvedValue({
    prepareTransaction: jest.fn().mockResolvedValue(preparedTransaction),
    getTransactionStatus: jest.fn().mockResolvedValue({ errors, estimatedFees: new BigNumber(12) }),
    getSerializedAddressParameters: jest.fn(() => Buffer.from("03", "hex")),
  } as unknown as Awaited<ReturnType<typeof getAccountBridge>>);
}

function run(callbacks: Partial<Parameters<typeof confirmTransferExchange>[1]> = {}) {
  return confirmTransferExchange(input, {
    transport,
    isCancelled: () => false,
    onConfirmationRequested: jest.fn(),
    ...callbacks,
  });
}

describe("confirmTransferExchange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getMainAccount).mockReturnValue(fromAccount);
    mockBridge();
  });

  it("confirms the exchange on the device and resolves with the prepared transaction", async () => {
    const exchangeApp = createExchangeApp();
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
    const onConfirmationRequested = jest.fn();

    await expect(run({ onConfirmationRequested })).resolves.toBe(preparedTransaction);

    expect(createExchange).toHaveBeenCalledWith(transport, SELL, undefined, 1);
    expect(exchangeApp.processTransaction).toHaveBeenCalledWith(
      Buffer.from("0a0b", "hex"),
      new BigNumber(12),
      "raw",
    );
    expect(onConfirmationRequested).toHaveBeenCalledWith("12");
    expect(exchangeApp.signCoinTransaction).toHaveBeenCalledTimes(1);
    // The user is told to look at the device before the call that waits for their approval.
    expect(onConfirmationRequested.mock.invocationCallOrder[0]).toBeLessThan(
      exchangeApp.signCoinTransaction.mock.invocationCallOrder[0],
    );
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

  it("names a DMK error of the session after its tag, keeping the step", async () => {
    const exchangeApp = createExchangeApp({
      processTransaction: jest.fn().mockRejectedValue(new DeviceDisconnectedWhileSendingError()),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    await expect(run()).rejects.toMatchObject({
      name: "CompleteExchangeError",
      step: "PROCESS_TRANSACTION",
      title: "DeviceDisconnectedWhileSendingError",
    });
  });

  it("keeps the step a failure happened on", async () => {
    const exchangeApp = createExchangeApp({
      checkPartner: jest.fn().mockRejectedValue(new Error("boom")),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    const error = await run().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CompleteExchangeError);
    expect(error).toMatchObject({ step: "CHECK_PARTNER", message: "boom" });
  });

  it("fails on the first validation error of the transaction before asking the device", async () => {
    const exchangeApp = createExchangeApp();
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);
    mockBridge({ errors: { amount: new Error("Amount is too low") } });

    const error = await run().catch((e: unknown) => e);

    expect(error).toMatchObject({ name: "CompleteExchangeError", step: "INIT" });
    expect(exchangeApp.setPartnerKey).not.toHaveBeenCalled();
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
    const onConfirmationRequested = jest.fn();

    await run({ isCancelled: () => cancelled, onConfirmationRequested });

    expect(exchangeApp.validatePayoutOrAsset).not.toHaveBeenCalled();
    expect(onConfirmationRequested).not.toHaveBeenCalled();
  });

  it("reports a rejection of the review as a userRefused error of the payout check", async () => {
    const exchangeApp = createExchangeApp({
      validatePayoutOrAsset: jest.fn().mockRejectedValue(new TransportStatusError(0x6a84)),
    });
    jest.mocked(createExchange).mockReturnValue(exchangeApp as never);

    await expect(run()).rejects.toMatchObject({
      name: "CompleteExchangeError",
      step: "CHECK_PAYOUT_ADDRESS",
      title: "userRefused",
    });
  });
});
