import { Observable, lastValueFrom, throwError } from "rxjs";
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
  ErrorCategory,
  TransactionStage,
  type LogEvent,
} from "@ledgerhq/transaction-observability";

// Cardano, so the family-aware normalization of the raw action is exercised end to end.
const account = {
  id: "acc",
  type: "Account",
  currency: { id: "cardano", family: "cardano", ticker: "ADA" },
} as unknown as Account;

const signedOperation = {
  signature: "sig",
  operation: { type: "DELEGATE", extra: {} },
} as never;

const coinModuleSource = {
  mevProtected: false,
  source: { type: "coin-module" as const, name: "ledger-live-desktop" },
};

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
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    const result = await wrapped.broadcast({
      account,
      signedOperation,
      broadcastConfig: coinModuleSource,
    });

    expect(result).toBe(operation);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      status: "success",
      stage: TransactionStage.Broadcast,
      currencyId: "cardano",
      family: "cardano",
      flow: "send",
      // The optimistic op type normalizes to the canonical action…
      earnTransactionType: "delegate",
      // …and the raw value is kept for drill-down.
      rawTransactionType: "DELEGATE",
    });
  });

  // One TransactionFlow per TransactionSource["type"], so no real source falls into
  // "unknown" — which is reserved for the sign stage, where the source is not yet known.
  test.each([
    ["coin-module", "send"],
    ["dApp", "dApp/eth_sendTransaction"],
    ["live-app", "wallet-api/transaction.signAndBroadcast"],
    ["swap", "swap"],
  ])("broadcast: attributes a %s source as flow=%s", async (type, expectedFlow) => {
    const bridge = makeBridge({ broadcast: jest.fn().mockResolvedValue({ id: "op-1" }) });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await wrapped.broadcast({
      account,
      signedOperation,
      broadcastConfig: {
        mevProtected: false,
        source: { type: type as "coin-module" | "dApp" | "live-app" | "swap", name: "x" },
      },
    });

    expect(events[0]).toMatchObject({ flow: expectedFlow });
  });

  test("broadcast: emits a categorized failure event and re-throws the original error", async () => {
    const error = new Error("insufficient_funds for gas");
    const bridge = makeBridge({ broadcast: jest.fn().mockRejectedValue(error) });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await expect(
      wrapped.broadcast({ account, signedOperation, broadcastConfig: coinModuleSource }),
    ).rejects.toBe(error);

    expect(events[0]).toMatchObject({
      status: "failure",
      stage: TransactionStage.Broadcast,
      errorCategory: ErrorCategory.GasInsufficientBalance,
      txPayload: { signature: "sig" },
    });
  });

  test("broadcast: a plain send emits nothing the earn funnel would pick up", async () => {
    const bridge = makeBridge({ broadcast: jest.fn().mockResolvedValue({ id: "op-1" }) });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await wrapped.broadcast({
      account,
      signedOperation: { signature: "sig", operation: { type: "OUT", extra: {} } } as never,
      broadcastConfig: coinModuleSource,
    });

    expect(events[0].earnTransactionType).toBeUndefined();
  });

  test("signOperation: emits a sign failure, re-throws, and subscribes exactly once", async () => {
    const error = Object.assign(new Error(""), { name: "UserRefusedOnDevice" });
    let subscribeCount = 0;
    const bridge = makeBridge({
      signOperation: jest.fn().mockReturnValue(
        new Observable(subscriber => {
          subscribeCount += 1;
          subscriber.error(error);
        }),
      ),
    });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await expect(
      lastValueFrom(
        wrapped.signOperation({
          account,
          transaction: { family: "cardano", mode: "delegate", poolId: "pool1" } as never,
          deviceId: "device",
        }),
      ),
    ).rejects.toBe(error);

    expect(subscribeCount).toBe(1);
    expect(events[0]).toMatchObject({
      status: "failure",
      stage: TransactionStage.Sign,
      errorCategory: ErrorCategory.UserDeviceRefused,
      earnTransactionType: "delegate",
      // The sign stage is the only place the delegation target is legible.
      validators: ["pool1"],
      // No broadcastConfig here, so the originating route is not yet known.
      flow: "unknown",
    });
    // Signing never completed, so there is no payload to report.
    expect(events[0]).not.toHaveProperty("txPayload");
  });

  test("signOperation: does not emit on sign success", async () => {
    const bridge = makeBridge({
      signOperation: jest.fn().mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ type: "signed", signedOperation });
          subscriber.complete();
        }),
      ),
    });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await lastValueFrom(
      wrapped.signOperation({ account, transaction: {} as never, deviceId: "device" }),
    );

    expect(events).toHaveLength(0);
  });

  // The seam sits in the transaction path, so a broken analytics sink must never surface as
  // a failed sign or broadcast.
  test("a throwing observer is isolated and cannot break emission", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    setTransactionObserver(() => {
      throw new Error("sink is broken");
    });
    const operation = { id: "op-1" };
    const bridge = makeBridge({ broadcast: jest.fn().mockResolvedValue(operation) });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await expect(
      wrapped.broadcast({ account, signedOperation, broadcastConfig: coinModuleSource }),
    ).resolves.toBe(operation);

    const signError = new Error("boom");
    const signing = makeBridge({
      signOperation: jest.fn().mockReturnValue(throwError(() => signError)),
    });
    const wrappedSigning = await wrapAccountBridge(signing, "cardano");
    await expect(
      lastValueFrom(
        wrappedSigning.signOperation({ account, transaction: {} as never, deviceId: "d" }),
      ),
    ).rejects.toBe(signError);

    warn.mockRestore();
  });
});
