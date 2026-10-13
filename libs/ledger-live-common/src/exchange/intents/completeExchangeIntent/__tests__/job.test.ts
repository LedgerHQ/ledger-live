import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { DeviceDisconnectedWhileSendingError } from "@ledgerhq/device-management-kit";
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { ExchangeType } from "@ledgerhq/wallet-api-exchange-module";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  Account,
  SignOperationEvent,
  SignedOperation,
  TokenAccount,
} from "@ledgerhq/types-live";
import { NEVER, Observable, of, throwError } from "rxjs";
import { delay } from "../../../../promise";
import { TransactionRefusedOnDevice } from "../../../../errors";
import { CompleteExchangeError } from "../../../error";
import type { Transaction } from "../../../../coin-modules/transaction-types";
import { getAccountBridge } from "../../../../bridge/index";
import { confirmTransferExchange } from "../../../platform/transfer/completeExchange";
import { confirmSwapExchange } from "../../../swap/completeExchange";
import {
  collectStates,
  deviceConnectionResult,
  deviceExtractedContext,
  flushPromises,
} from "../../tests/testUtils";
import { completeExchangeIntentJob } from "../job";
import type { CompleteExchangeIntentInput, CompleteExchangeIntentResult } from "../types";

jest.mock("../../../swap/completeExchange", () => ({ confirmSwapExchange: jest.fn() }));
jest.mock("../../../platform/transfer/completeExchange", () => ({
  confirmTransferExchange: jest.fn(),
}));
jest.mock("../../../../promise", () => ({ delay: jest.fn(() => Promise.resolve()) }));
jest.mock("../../../../bridge/index", () => ({ getAccountBridge: jest.fn() }));

const mockConfirmSwap = jest.mocked(confirmSwapExchange);
const mockConfirmTransfer = jest.mocked(confirmTransferExchange);

const fromAccount = {
  type: "Account",
  id: "from",
  currency: getCryptoCurrencyById("ethereum"),
} as Account;
const toAccount = {
  type: "Account",
  id: "to",
  currency: getCryptoCurrencyById("bitcoin"),
} as Account;
const transaction = { family: "evm" } as Transaction;
const preparedTransaction = { family: "evm", prepared: true } as unknown as Transaction;
const signedOperation = { operation: { id: "operation-1" } } as SignedOperation;

const swapInput: CompleteExchangeIntentInput = {
  exchangeType: ExchangeType.SWAP,
  provider: "changelly",
  exchange: {
    fromAccount,
    fromParentAccount: undefined,
    fromCurrency: fromAccount.currency,
    toAccount,
    toParentAccount: undefined,
    toCurrency: toAccount.currency,
  },
  transaction,
  binaryPayload: "payload",
  signature: "signature",
  sponsored: true,
};

const sellInput: CompleteExchangeIntentInput = {
  ...swapInput,
  exchangeType: ExchangeType.SELL,
  exchange: {
    fromAccount,
    fromParentAccount: undefined,
    fromCurrency: fromAccount.currency,
  },
};

function mockBridge(events$: Observable<SignOperationEvent>) {
  const signOperation = jest.fn((_params: unknown) => events$);
  jest
    .mocked(getAccountBridge)
    .mockResolvedValue({ signOperation } as unknown as Awaited<
      ReturnType<typeof getAccountBridge>
    >);
  return signOperation;
}

function mockConfirmedSwap() {
  mockConfirmSwap.mockImplementation(async (_input, { onConfirmationRequested }) => {
    onConfirmationRequested("42");
    return preparedTransaction;
  });
}

function startJob(input: CompleteExchangeIntentInput) {
  const onResult = jest.fn<void, [CompleteExchangeIntentResult]>();
  const job$ = completeExchangeIntentJob({
    deviceConnectionResult,
    deviceExtractedContext,
    input,
    onResult,
  });
  return { onResult, ...collectStates(job$) };
}

describe("completeExchangeIntentJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("confirms a swap on the Exchange app, then has the coin app sign it", async () => {
    mockConfirmedSwap();
    const events: SignOperationEvent[] = [
      { type: "device-signature-requested" },
      { type: "device-signature-granted" },
      { type: "signed", signedOperation },
    ];
    const signOperation = mockBridge(of(...events));

    const { states, completed, onResult } = startJob(swapInput);
    await flushPromises();

    expect(mockConfirmSwap).toHaveBeenCalledWith(
      expect.objectContaining({
        exchangeType: ExchangeType.SWAP,
        provider: "changelly",
        binaryPayload: "payload",
        signature: "signature",
        deviceModelId: DeviceModelId.nanoX,
      }),
      expect.objectContaining({ transport: expect.objectContaining({ sessionId: "session-1" }) }),
    );
    expect(mockConfirmTransfer).not.toHaveBeenCalled();
    expect(signOperation).toHaveBeenCalledWith({
      account: fromAccount,
      transaction: preparedTransaction,
      deviceId: "device-1",
      deviceModelId: DeviceModelId.nanoX,
    });
    expect(states).toEqual([
      { type: "preparing", deviceModelId: DeviceModelId.nanoX },
      {
        type: "awaiting-confirmation",
        deviceModelId: DeviceModelId.nanoX,
        exchangeType: ExchangeType.SWAP,
        provider: "changelly",
        sponsored: true,
        estimatedFees: "42",
      },
      { type: "confirmed" },
      { type: "pending", deviceModelId: DeviceModelId.nanoX },
      { type: "device-signature-requested", deviceModelId: DeviceModelId.nanoX },
      { type: "device-signature-granted", deviceModelId: DeviceModelId.nanoX },
      { type: "signed", signedOperation },
    ]);
    expect(completed()).toBe(true);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ status: "signed", signedOperation });
  });

  it("waits for the Exchange app to hand over before signing", async () => {
    let finishDelay: () => void = () => undefined;
    jest.mocked(delay).mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finishDelay = resolve;
        }),
    );
    mockConfirmedSwap();
    const signOperation = mockBridge(of({ type: "signed", signedOperation }));

    const { states, completed, onResult } = startJob(swapInput);
    await flushPromises();

    expect(states.at(-1)).toEqual({ type: "confirmed" });
    expect(signOperation).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
    expect(completed()).toBe(false);

    finishDelay();
    await flushPromises();

    expect(signOperation).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ status: "signed", signedOperation });
    expect(completed()).toBe(true);
  });

  it.each([
    ["sell", ExchangeType.SELL],
    ["fund", ExchangeType.FUND],
  ])("uses the transfer confirmation for a %s", async (_name, exchangeType) => {
    mockConfirmTransfer.mockResolvedValue(preparedTransaction);
    mockBridge(of({ type: "signed", signedOperation }));

    const { onResult } = startJob({ ...sellInput, exchangeType });
    await flushPromises();

    expect(mockConfirmTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ exchangeType }),
      expect.anything(),
    );
    expect(mockConfirmSwap).not.toHaveBeenCalled();
    expect(onResult).toHaveBeenCalledWith({ status: "signed", signedOperation });
  });

  it("signs a token account with its parent account", async () => {
    const tokenAccount = {
      type: "TokenAccount",
      id: "token",
      parentId: fromAccount.id,
      token: { type: "TokenCurrency", id: "ethereum/erc20/usd__coin" },
    } as TokenAccount;
    mockConfirmedSwap();
    const signOperation = mockBridge(of({ type: "signed", signedOperation }));

    startJob({
      ...swapInput,
      exchange: {
        ...swapInput.exchange,
        fromAccount: tokenAccount,
        fromParentAccount: fromAccount,
      },
    });
    await flushPromises();

    expect(signOperation).toHaveBeenCalledWith(expect.objectContaining({ account: fromAccount }));
  });

  it("does not report the sponsorship of a transfer it was not given", async () => {
    mockConfirmTransfer.mockImplementation(async (_input, { onConfirmationRequested }) => {
      onConfirmationRequested("1");
      return preparedTransaction;
    });
    mockBridge(of({ type: "signed", signedOperation }));

    const { states } = startJob({ ...sellInput, sponsored: undefined });
    await flushPromises();

    expect(states[1]).toEqual(
      expect.objectContaining({ type: "awaiting-confirmation", sponsored: false }),
    );
  });

  describe("on the Exchange app", () => {
    it("ends on a refused state when the user refuses the exchange", async () => {
      const refusal = new TransactionRefusedOnDevice();
      mockConfirmSwap.mockRejectedValue(refusal);
      const signOperation = mockBridge(of({ type: "signed", signedOperation }));

      const { states, completed, onResult } = startJob(swapInput);
      await flushPromises();

      expect(states).toEqual([
        { type: "preparing", deviceModelId: DeviceModelId.nanoX },
        { type: "refused" },
      ]);
      expect(completed()).toBe(true);
      expect(onResult).toHaveBeenCalledWith({ status: "refused", error: refusal });
      expect(signOperation).not.toHaveBeenCalled();
    });

    it.each([
      ["the review of a swap", swapInput, mockConfirmSwap, "CHECK_REFUND_ADDRESS", "userRefused"],
      [
        "the review of a sell",
        sellInput,
        mockConfirmTransfer,
        "CHECK_PAYOUT_ADDRESS",
        "userRefused",
      ],
      [
        "a cross-seed swap",
        swapInput,
        mockConfirmSwap,
        "CHECK_REFUND_ADDRESS",
        "userRefusedCrossSeed",
      ],
    ] as const)(
      "ends on a refused state when the user rejects %s, keeping the step",
      async (_name, input, confirm, step, title) => {
        const refusal = new CompleteExchangeError(step, title, "User refused");
        confirm.mockRejectedValue(refusal);

        const { states, onResult } = startJob(input);
        await flushPromises();

        expect(states.at(-1)).toEqual({ type: "refused" });
        expect(onResult).toHaveBeenCalledWith({ status: "refused", error: refusal });
      },
    );

    it("reports a DMK error of the session as an Error named after its tag", async () => {
      mockConfirmSwap.mockRejectedValue(new DeviceDisconnectedWhileSendingError());

      const { states, onResult } = startJob(swapInput);
      await flushPromises();

      const named = expect.objectContaining({ name: "DeviceDisconnectedWhileSendingError" });
      expect(states.at(-1)).toEqual({ type: "error", error: named });
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed", error: named }),
      );
    });

    it("does not take another error of a step for a refusal", async () => {
      const failure = new CompleteExchangeError(
        "CHECK_REFUND_ADDRESS",
        "invalidAddress",
        "Invalid",
      );
      mockConfirmSwap.mockRejectedValue(failure);

      const { states, onResult } = startJob(swapInput);
      await flushPromises();

      expect(states.at(-1)).toEqual({ type: "error", error: failure });
      expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
    });

    it("reports a failure with the device it failed on", async () => {
      const failure = new Error("signature rejected");
      mockConfirmSwap.mockRejectedValue(failure);

      const { states, completed, onResult } = startJob(swapInput);
      await flushPromises();

      expect(states[1]).toEqual({ type: "error", error: failure });
      expect(completed()).toBe(true);
      expect(onResult).toHaveBeenCalledWith({
        status: "failed",
        error: failure,
        deviceModelId: DeviceModelId.nanoX,
      });
    });

    it.each([
      ["has no destination account property", sellInput.exchange],
      [
        "has an undefined destination account",
        { ...swapInput.exchange, toAccount: undefined as unknown as Account },
      ],
    ])("fails a swap whose exchange %s", async (_name, exchange) => {
      const { states, onResult } = startJob({ ...swapInput, exchange });
      await flushPromises();

      expect(mockConfirmSwap).not.toHaveBeenCalled();
      expect(states[1]).toEqual({
        type: "error",
        error: new Error("'toAccount' requested for Swap exchange"),
      });
      expect(onResult).toHaveBeenCalledWith({
        status: "failed",
        error: expect.any(Error),
        deviceModelId: DeviceModelId.nanoX,
      });
    });

    it("fails an exchange type it does not handle", async () => {
      const { states } = startJob({ ...swapInput, exchangeType: 0x42 });
      await flushPromises();

      expect(states[1]).toEqual({ type: "error", error: new Error("exchangeType not handled") });
    });

    it("stops the device sequence and reports nothing once unsubscribed", async () => {
      let isCancelled: () => boolean = () => false;
      let finish: (transaction: Transaction) => void = () => undefined;
      mockConfirmSwap.mockImplementation((_input, callbacks) => {
        isCancelled = callbacks.isCancelled;
        return new Promise<Transaction>(resolve => {
          finish = resolve;
        });
      });
      const signOperation = mockBridge(of({ type: "signed", signedOperation }));

      const { states, onResult, unsubscribe } = startJob(swapInput);
      await flushPromises();
      expect(isCancelled()).toBe(false);

      unsubscribe();
      finish(preparedTransaction);
      await flushPromises();

      expect(isCancelled()).toBe(true);
      expect(states).toEqual([{ type: "preparing", deviceModelId: DeviceModelId.nanoX }]);
      expect(onResult).not.toHaveBeenCalled();
      expect(signOperation).not.toHaveBeenCalled();
    });
  });

  describe("on the coin app", () => {
    it.each([
      ["a refusal of the transaction", () => new UserRefusedOnDevice()],
      ["a 0x6985 status", () => new TransportStatusError(0x6985)],
    ])("ends on a refused state, without retry, on %s", async (_name, createError) => {
      mockConfirmedSwap();
      mockBridge(throwError(createError));

      const { states, completed, onResult } = startJob(swapInput);
      await flushPromises();

      expect(states.slice(-2)).toEqual([
        { type: "pending", deviceModelId: DeviceModelId.nanoX },
        { type: "refused" },
      ]);
      expect(completed()).toBe(true);
      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith({ status: "refused" });
    });

    it("reports a failure without a device, as the exchange itself was confirmed", async () => {
      const failure = new Error("device locked");
      mockConfirmedSwap();
      mockBridge(throwError(() => failure));

      const { states, completed, onResult } = startJob(swapInput);
      await flushPromises();

      expect(states.at(-1)).toEqual({ type: "error", error: failure });
      expect(completed()).toBe(true);
      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith({ status: "failed", error: failure });
    });

    it("stops signing and reports nothing once unsubscribed", async () => {
      const stopSigning = jest.fn();
      mockConfirmedSwap();
      mockBridge(new Observable<SignOperationEvent>(() => stopSigning));

      const { states, onResult, unsubscribe } = startJob(swapInput);
      await flushPromises();
      expect(states.at(-1)).toEqual({ type: "pending", deviceModelId: DeviceModelId.nanoX });

      unsubscribe();

      expect(stopSigning).toHaveBeenCalledTimes(1);
      expect(onResult).not.toHaveBeenCalled();
    });

    it("never signs once unsubscribed during the handover", async () => {
      let finishDelay: () => void = () => undefined;
      jest.mocked(delay).mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            finishDelay = resolve;
          }),
      );
      mockConfirmedSwap();
      const signOperation = mockBridge(NEVER);

      const { unsubscribe } = startJob(swapInput);
      await flushPromises();
      unsubscribe();
      finishDelay();
      await flushPromises();

      expect(signOperation).not.toHaveBeenCalled();
    });
  });
});
