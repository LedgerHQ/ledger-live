import { Observable, lastValueFrom } from "rxjs";
import type { Account, AccountBridge } from "@ledgerhq/types-live";

// Isolate the seam from real coin-module extension loading (keeps this unit test free of
// coin-module lib builds; the real registry is exercised by impl.test.ts).
jest.mock("../coin-modules/registry", () => ({
  loadBridgeExtensionsForFamily: jest.fn().mockResolvedValue({}),
  loadSetupForFamily: jest.fn(),
  loadMockBridgeForFamily: jest.fn(),
}));

import { wrapAccountBridge } from "./impl";
import {
  setTransactionObserver,
  resetTransactionObservers,
  emitTransactionEvent,
  ErrorCategory,
  TransactionStage,
  type LogEvent,
} from "@ledgerhq/transaction-observability";

const account = {
  id: "acc",
  type: "Account",
  currency: { id: "bitcoin", family: "bitcoin" },
} as unknown as Account;

const signedOperation = { signature: "sig", operation: { type: "DELEGATE" } } as never;

const makeBridge = (overrides: Partial<AccountBridge<never>>): AccountBridge<never> =>
  ({
    getTransactionStatus: jest.fn(),
    signOperation: jest.fn(),
    broadcast: jest.fn(),
    ...overrides,
  }) as unknown as AccountBridge<never>;

describe("wrapAccountBridge — transaction observability seam", () => {
  let events: LogEvent[];
  beforeEach(() => {
    resetTransactionObservers();
    events = [];
    setTransactionObserver(e => events.push(e));
  });
  afterEach(() => resetTransactionObservers());

  test("broadcast: emits a success event and returns the operation unchanged", async () => {
    const operation = { id: "op-1" };
    const bridge = makeBridge({ broadcast: jest.fn().mockResolvedValue(operation) });
    const wrapped = await wrapAccountBridge(bridge, "bitcoin");

    const result = await wrapped.broadcast({
      account,
      signedOperation,
      broadcastConfig: {
        mevProtected: false,
        source: { type: "coin-module", name: "ledger-live-desktop" },
      },
    });

    expect(result).toBe(operation);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      status: "success",
      stage: TransactionStage.Broadcast,
      currencyId: "bitcoin",
      family: "bitcoin",
      flow: "send",
      transactionType: "DELEGATE",
    });
  });

  test("broadcast: emits a categorized failure event and re-throws the original error", async () => {
    const error = new Error("insufficient_funds for gas");
    const bridge = makeBridge({ broadcast: jest.fn().mockRejectedValue(error) });
    const wrapped = await wrapAccountBridge(bridge, "bitcoin");

    await expect(
      wrapped.broadcast({ account, signedOperation, broadcastConfig: undefined }),
    ).rejects.toBe(error);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      status: "failure",
      stage: TransactionStage.Broadcast,
      errorCategory: ErrorCategory.GasInsufficientBalance,
      flow: "unknown",
    });
  });

  test("signOperation: emits a sign failure, re-throws, and subscribes exactly once", async () => {
    const error = Object.assign(new Error("refused"), { name: "UserRefusedOnDevice" });
    let subscribeCount = 0;
    const signObs = new Observable(subscriber => {
      subscribeCount += 1;
      subscriber.error(error);
    });
    const bridge = makeBridge({ signOperation: jest.fn().mockReturnValue(signObs) });
    const wrapped = await wrapAccountBridge(bridge, "bitcoin");

    await expect(
      lastValueFrom(
        wrapped.signOperation({
          account,
          transaction: { family: "cardano", mode: "delegate" },
          deviceId: "",
        } as never),
      ),
    ).rejects.toBe(error);

    expect(subscribeCount).toBe(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      status: "failure",
      stage: TransactionStage.Sign,
      errorCategory: ErrorCategory.UserDeviceRefused,
      flow: "unknown",
      transactionType: "delegate",
    });
  });

  test("signOperation: does not emit on sign success", async () => {
    const signObs = new Observable<{ type: string }>(subscriber => {
      subscriber.next({ type: "device-signature-requested" });
      subscriber.next({ type: "signed" });
      subscriber.complete();
    });
    const bridge = makeBridge({ signOperation: jest.fn().mockReturnValue(signObs) });
    const wrapped = await wrapAccountBridge(bridge, "bitcoin");

    await lastValueFrom(
      wrapped.signOperation({
        account,
        transaction: { family: "cardano", mode: "delegate" },
        deviceId: "",
      } as never),
    );

    expect(events).toHaveLength(0);
  });

  test("a throwing observer is isolated and cannot break emission", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    resetTransactionObservers();
    setTransactionObserver(() => {
      throw new Error("bad sink");
    });
    const ok: LogEvent[] = [];
    setTransactionObserver(e => ok.push(e));
    expect(() =>
      emitTransactionEvent({
        status: "success",
        stage: TransactionStage.Broadcast,
        flow: "send",
        appVersion: "t",
        currencyId: "bitcoin",
        family: "bitcoin",
        isTestnet: false,
        isSendMax: false,
      } as LogEvent),
    ).not.toThrow();
    expect(ok).toHaveLength(1);
    consoleSpy.mockRestore();
  });
});
