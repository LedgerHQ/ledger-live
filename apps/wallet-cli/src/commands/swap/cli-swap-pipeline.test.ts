import { afterEach, describe, expect, it, mock } from "bun:test";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { getAccountBridge as getLiveAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { CommandOutput } from "../../output";

/**
 * The full swap pipeline must keep the Exchange app session open across the entire
 * start-exchange + complete-exchange flow. Previously `startExchangeContext` opened
 * (and reset) its own session before the rest of the pipeline ran inside a second
 * session — causing the Exchange app to be re-opened mid-flow on the device.
 *
 * These tests pin the contract: `withLedgerManagerAppSession` is called exactly
 * once per `runFullSwapPipeline`, and both device APDUs (`startExchange` and
 * `completeExchange`) happen inside that single session.
 */

const events: string[] = [];
let updatedTransactionAmount = new BigNumber("1000000000000000000");

mock.module("../../session/exchange-device-session", () => ({
  withLedgerManagerAppSession: async <T>(_app: string, fn: () => Promise<T>): Promise<T> => {
    events.push("session:open");
    try {
      return await fn();
    } finally {
      events.push("session:close");
    }
  },
}));

mock.module("@ledgerhq/live-common/exchange/platform/startExchange", () => ({
  default: () =>
    new Observable(observer => {
      events.push("startExchange");
      observer.next({
        type: "start-exchange-result",
        startExchangeResult: {
          nonce: "tx-id-123",
          device: { deviceId: "wallet-cli-dmk", modelId: "nanoX", wired: true },
        },
      });
      observer.complete();
    }),
}));

mock.module("@ledgerhq/live-common/exchange/platform/completeExchange", () => ({
  default: ({ transaction }: { transaction: unknown }) =>
    new Observable(observer => {
      events.push("completeExchange");
      observer.next({ type: "complete-exchange-requested" });
      observer.next({ type: "complete-exchange-result", completeExchangeResult: transaction });
      observer.complete();
    }),
}));

const retrieveSwapPayloadMock = mock(async () => ({
  binaryPayload: "00",
  signature: "sig",
  payinAddress: "0x000000000000000000000000000000000000dead",
  swapId: "swap-id",
}));
mock.module("@ledgerhq/live-common/exchange/swap/api/v5/actions", () => ({
  retrieveSwapPayload: retrieveSwapPayloadMock,
}));

mock.module("@ledgerhq/live-common/exchange/swap/transactionStrategies", () => ({
  transactionStrategy: {
    ethereum: ({ amount, recipient }: { amount: BigNumber; recipient: string }) => ({
      family: "ethereum",
      amount,
      recipient,
    }),
  },
}));

mock.module("@ledgerhq/hw-app-exchange", () => ({
  decodeSwapPayload: async () => ({ amountToWallet: "1000000000000000000" }),
}));

const { runFullSwapPipeline } = await import("./cli-swap-pipeline");

function makeAccount(id: string): Account {
  return {
    type: "Account",
    id,
    freshAddress: `0x${id}`,
    currency: { id: "ethereum", family: "ethereum" },
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddressPath: "",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    swapHistory: [],
    syncHash: "",
  } as unknown as Account;
}

function makeOutput(): CommandOutput {
  return {
    swapExecuteProgress: () => {},
  } as unknown as CommandOutput;
}

const mockSignedOperation = {
  operation: {},
  signature: "mock-signature",
} as unknown as SignedOperation;

function getAccountBridge(): ReturnType<typeof getLiveAccountBridge> {
  return {
    createTransaction: () => ({
      family: "ethereum",
      amount: new BigNumber(0),
      recipient: "",
    }),
    updateTransaction: (
      tx: Record<string, unknown>,
      patch: Record<string, unknown>,
    ): Record<string, unknown> => ({ ...tx, ...patch, amount: updatedTransactionAmount }),
    signOperation: () =>
      new Observable(observer => {
        observer.next({ type: "signed", signedOperation: mockSignedOperation });
        observer.complete();
      }),
    // Pipeline always calls broadcast; no on-chain hash in this unit test.
    broadcast: async () => ({ hash: undefined }) as unknown as Operation,
  } as unknown as ReturnType<typeof getLiveAccountBridge>;
}

async function getDeviceModelId() {
  return DeviceModelId.nanoX;
}

describe("runFullSwapPipeline session lifecycle", () => {
  afterEach(() => {
    events.length = 0;
    updatedTransactionAmount = new BigNumber("1000000000000000000");
    retrieveSwapPayloadMock.mockClear();
  });

  it("opens a single Exchange app session for the entire start→complete flow", async () => {
    const result = await runFullSwapPipeline({
      out: makeOutput(),
      provider: "changelly",
      amount: "1",
      amountInAtomicUnit: new BigNumber("1000000000000000000"),
      feeStrategy: "medium",
      fromAccount: makeAccount("from"),
      toAccount: makeAccount("to"),
      getAccountBridge,
      getDeviceModelId,
    });

    expect(events).toEqual(["session:open", "startExchange", "completeExchange", "session:close"]);
    expect(result.transactionId).toBe("tx-id-123");
    expect(result.operationHash).toBeUndefined();
    expect(retrieveSwapPayloadMock).toHaveBeenCalledTimes(1);
  });

  it("omits magnitudeAwareRate when the prepared transaction amount is zero", async () => {
    updatedTransactionAmount = new BigNumber(0);

    const result = await runFullSwapPipeline({
      out: makeOutput(),
      provider: "changelly",
      amount: "1",
      amountInAtomicUnit: new BigNumber("1000000000000000000"),
      feeStrategy: "medium",
      fromAccount: makeAccount("from"),
      toAccount: makeAccount("to"),
      getAccountBridge,
    });

    expect(result.magnitudeAwareRate).toBeUndefined();
    expect(result).not.toHaveProperty("magnitudeAwareRate");
  });

  it("closes the session even when the swap API call throws", async () => {
    const apiError = new Error("swap API down");
    retrieveSwapPayloadMock.mockImplementationOnce(async () => {
      throw apiError;
    });

    await expect(
      runFullSwapPipeline({
        out: makeOutput(),
        provider: "changelly",
        amount: "1",
        amountInAtomicUnit: new BigNumber("1000000000000000000"),
        feeStrategy: "medium",
        fromAccount: makeAccount("from"),
        toAccount: makeAccount("to"),
        getAccountBridge,
        getDeviceModelId,
      }),
    ).rejects.toBe(apiError);

    expect(events).toEqual(["session:open", "startExchange", "session:close"]);
  });
});
