import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import type { Unit } from "@domain/entity-currency-unit";
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

const mockEthUnit: Unit = {
  name: "Ether",
  code: "ETH",
  magnitude: 18,
};

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

function mockHwAppExchange(amountToWallet = "1000000000000000000") {
  mock.module("@ledgerhq/hw-app-exchange", () => ({
    decodeSwapPayload: async () => ({ amountToWallet }),
    getExchangeErrorMessage: () => ({ errorName: undefined, errorMessage: undefined }),
  }));
}

const setBroadcastTransactionMock = mock(async () => {});
const postSwapAcceptedMock = mock(async () => null);
const postSwapCancelledMock = mock(async () => null);

mock.module("@ledgerhq/live-common/exchange/swap/setBroadcastTransaction", () => ({
  setBroadcastTransaction: setBroadcastTransactionMock,
}));

mock.module("@ledgerhq/live-common/exchange/swap/postSwapState", () => ({
  postSwapAccepted: postSwapAcceptedMock,
  postSwapCancelled: postSwapCancelledMock,
}));

// mock.module is global and persists across test files, so this keeps every real export and
// makes the spy a pass-through: any suite that ends up with this module still gets real
// behaviour, whatever order Bun happens to load the files in.
const swapAnalytics = await import("../../analytics/swap-analytics");
const trackSwapCompletedMock = mock(swapAnalytics.trackSwapCompleted);
mock.module("../../analytics/swap-analytics", () => ({
  ...swapAnalytics,
  trackSwapCompleted: trackSwapCompletedMock,
}));

mockHwAppExchange();

const { runFullSwapPipeline } = await import("./cli-swap-pipeline");

function makeAccount(id: string, units: Unit[] = [mockEthUnit]): Account {
  return {
    type: "Account",
    id,
    freshAddress: `0x${id}`,
    currency: { id: "ethereum", family: "ethereum", units },
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
    broadcast: async () => ({ hash: "tx-hash-123" }) as unknown as Operation,
  } as unknown as ReturnType<typeof getLiveAccountBridge>;
}

async function getDeviceModelId() {
  return DeviceModelId.nanoX;
}

describe("runFullSwapPipeline session lifecycle", () => {
  beforeEach(() => {
    mockHwAppExchange();
  });

  afterEach(() => {
    events.length = 0;
    updatedTransactionAmount = new BigNumber("1000000000000000000");
    retrieveSwapPayloadMock.mockClear();
    setBroadcastTransactionMock.mockClear();
    postSwapCancelledMock.mockClear();
    trackSwapCompletedMock.mockClear();
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
    expect(result.operationHash).toBe("tx-hash-123");
    expect(result.amountExpectedTo).toBe("1");
    expect(result.amountExpectedToAtomic).toBe("1000000000000000000");
    expect(result.magnitudeAwareRate).toBe("1");
    expect(retrieveSwapPayloadMock).toHaveBeenCalledTimes(1);
    expect(setBroadcastTransactionMock).toHaveBeenCalledTimes(1);
    expect(setBroadcastTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "changelly",
        result: { operation: "tx-hash-123", swapId: "swap-id" },
        sourceCurrencyId: "ethereum",
        targetCurrencyId: "ethereum",
        hardwareWalletType: DeviceModelId.nanoX,
        swapType: "float",
        fromAccountAddress: "0xfrom",
        toAccountAddress: "0xto",
        fromAmount: "1",
      }),
    );
    expect(postSwapCancelledMock).not.toHaveBeenCalled();
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
    expect(setBroadcastTransactionMock).not.toHaveBeenCalled();
    expect(postSwapCancelledMock).not.toHaveBeenCalled();
  });

  it("reports swap cancelled when the pipeline fails after swapId is known", async () => {
    const signError = new Error("user rejected signing");
    const getAccountBridgeWithSignFailure = (): ReturnType<typeof getLiveAccountBridge> => {
      const bridge = getAccountBridge();
      return {
        ...bridge,
        signOperation: () =>
          new Observable(observer => {
            observer.error(signError);
          }),
      } as unknown as ReturnType<typeof getLiveAccountBridge>;
    };

    await expect(
      runFullSwapPipeline({
        out: makeOutput(),
        provider: "changelly",
        amount: "1",
        amountInAtomicUnit: new BigNumber("1000000000000000000"),
        feeStrategy: "medium",
        fromAccount: makeAccount("from"),
        toAccount: makeAccount("to"),
        getAccountBridge: getAccountBridgeWithSignFailure,
        getDeviceModelId,
      }),
    ).rejects.toBe(signError);

    expect(setBroadcastTransactionMock).not.toHaveBeenCalled();
    expect(postSwapCancelledMock).toHaveBeenCalledTimes(1);
    expect(postSwapCancelledMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "changelly",
        swapId: "swap-id",
        swapStep: "INIT",
        statusCode: "Error",
        errorMessage: "user rejected signing",
        sourceCurrencyId: "ethereum",
        targetCurrencyId: "ethereum",
        hardwareWalletType: DeviceModelId.nanoX,
        swapType: "float",
        fromAccountAddress: "0xfrom",
        toAccountAddress: "0xto",
        fromAmount: "1",
      }),
    );
  });

  it("converts amountExpectedTo to display units (magnitude=18)", async () => {
    mockHwAppExchange("1234500000000000000");

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

    expect(result.amountExpectedTo).toBe("1.2345");
    expect(result.amountExpectedToAtomic).toBe("1234500000000000000");
  });

  it("converts amountExpectedTo to display units (magnitude=6)", async () => {
    mockHwAppExchange("1234500");

    const usdtUnit: Unit = { name: "USDT", code: "USDT", magnitude: 6 };

    const result = await runFullSwapPipeline({
      out: makeOutput(),
      provider: "changelly",
      amount: "1",
      amountInAtomicUnit: new BigNumber("1000000"),
      feeStrategy: "medium",
      fromAccount: makeAccount("from", [usdtUnit]),
      toAccount: makeAccount("to", [usdtUnit]),
      getAccountBridge,
      getDeviceModelId,
    });

    expect(result.amountExpectedTo).toBe("1.2345");
    expect(result.amountExpectedToAtomic).toBe("1234500");
  });

  it("renders sub-unit amounts in full decimal notation rather than exponential", async () => {
    mockHwAppExchange("1");

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

    expect(result.amountExpectedTo).toBe("0.000000000000000001");
    expect(result.amountExpectedToAtomic).toBe("1");
  });

  it("keeps full precision for magnitudes above BigNumber's DECIMAL_PLACES", async () => {
    mockHwAppExchange("1234500000000000000000123");

    const nearUnit: Unit = { name: "NEAR", code: "NEAR", magnitude: 24 };

    const result = await runFullSwapPipeline({
      out: makeOutput(),
      provider: "changelly",
      amount: "1",
      amountInAtomicUnit: new BigNumber("1000000000000000000000000"),
      feeStrategy: "medium",
      fromAccount: makeAccount("from", [nearUnit]),
      toAccount: makeAccount("to", [nearUnit]),
      getAccountBridge,
      getDeviceModelId,
    });

    expect(result.amountExpectedTo).toBe("1.234500000000000000000123");
  });

  it("reports the analytics toAmount in display units", async () => {
    mockHwAppExchange("1234500000000000000");

    await runFullSwapPipeline({
      out: makeOutput(),
      provider: "changelly",
      amount: "1",
      amountInAtomicUnit: new BigNumber("1000000000000000000"),
      feeStrategy: "medium",
      fromAccount: makeAccount("from"),
      toAccount: makeAccount("to"),
      getAccountBridge,
      getDeviceModelId,
      flowId: "flow-id-123",
    });

    expect(trackSwapCompletedMock).toHaveBeenCalledTimes(1);
    expect(trackSwapCompletedMock).toHaveBeenCalledWith({
      flowId: "flow-id-123",
      fromCurrency: "ethereum",
      toCurrency: "ethereum",
      provider: "changelly",
      fromAmount: "1",
      toAmount: "1.2345",
    });
  });
});
