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
import { withLiveAppContext } from "../wallet-api/blindSigningContext";
import type { AppManifest } from "../wallet-api/types";
import {
  setTransactionObserver,
  resetTransactionObservers,
  ErrorCategory,
  TransactionStage,
  toSegmentTrackEvent,
  toTxLifecyclePayload,
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
      pathway: "send",
      // The optimistic op type normalizes to the canonical action…
      earnTransactionType: "delegate",
      // …and the raw value is kept for drill-down.
      rawTransactionType: "DELEGATE",
    });
  });

  // One TransactionPathway per TransactionSource["type"], so no real source falls into
  // "unknown" — which is reserved for the sign stage, where the source is not yet known.
  test.each([
    ["coin-module", "send"],
    ["dApp", "dApp/eth_sendTransaction"],
    ["live-app", "wallet-api/transaction.signAndBroadcast"],
    ["swap", "swap"],
  ])("broadcast: attributes a %s source as pathway=%s", async (type, expectedPathway) => {
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

    expect(events[0]).toMatchObject({ pathway: expectedPathway });
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

  test("broadcast: a plain send is observed but derives no staking action", async () => {
    const bridge = makeBridge({ broadcast: jest.fn().mockResolvedValue({ id: "op-1" }) });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await wrapped.broadcast({
      account,
      signedOperation: { signature: "sig", operation: { type: "OUT", extra: {} } } as never,
      broadcastConfig: coinModuleSource,
    });

    expect(events[0].earnTransactionType).toBeUndefined();
    expect(toTxLifecyclePayload(events[0], "desktop")).toBeNull();
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
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      status: "intent",
      stage: TransactionStage.Sign,
      earnTransactionType: "delegate",
    });
    expect(events[1]).toMatchObject({
      status: "failure",
      stage: TransactionStage.Sign,
      errorCategory: ErrorCategory.UserDeviceRefused,
      earnTransactionType: "delegate",
      // The sign stage is the only place the delegation target is legible.
      validators: ["pool1"],
      // No broadcastConfig here, so the originating route is not yet known.
      pathway: "unknown",
    });
    // Signing never completed, so there is no payload to report.
    expect(events[1]).not.toHaveProperty("txPayload");
    expect(toTxLifecyclePayload(events[0], "desktop")).toMatchObject({
      event: "tx_intent",
      path: "native",
      currency_family: "other",
    });
    expect(toTxLifecyclePayload(events[1], "desktop")).toMatchObject({
      event: "tx_terminal",
      outcome: "failure",
      failure_class: "user_cancel",
    });
  });

  test("signOperation: observability classification cannot prevent signing", async () => {
    const signOperation = jest.fn().mockReturnValue(new Observable());
    const bridge = makeBridge({ signOperation });
    const wrapped = await wrapAccountBridge(bridge, "cardano");
    const transaction = new Proxy(
      {},
      {
        get() {
          throw new Error("unsupported transaction shape");
        },
      },
    );

    expect(() =>
      wrapped.signOperation({
        account,
        transaction: transaction as never,
        deviceId: "device",
      }),
    ).not.toThrow();
    expect(signOperation).toHaveBeenCalledTimes(1);
    expect(events).toEqual([]);
  });

  test("signRawOperation: preserves dapp attribution and reports sign failures", async () => {
    const error = Object.assign(new Error(""), { name: "UserRefusedOnDevice" });
    const bridge = makeBridge({
      signRawOperation: jest.fn().mockReturnValue(throwError(() => error)),
    });
    const wrapped = await wrapAccountBridge(bridge, "cardano");

    await expect(
      withLiveAppContext({ id: "stakekit" }, async () =>
        lastValueFrom(
          wrapped.signRawOperation({
            account,
            transaction: "{}",
            deviceId: "device",
          }),
        ),
      ),
    ).rejects.toBe(error);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      status: "intent",
      stage: TransactionStage.Sign,
      manifestId: "stakekit",
    });
    expect(events[1]).toMatchObject({
      status: "failure",
      stage: TransactionStage.Sign,
      manifestId: "stakekit",
      errorCategory: ErrorCategory.UserDeviceRefused,
    });
    expect(toTxLifecyclePayload(events[0], "mobile")).toMatchObject({
      event: "tx_intent",
      path: "dapp",
    });
  });

  describe("sign-stage attribution from the live-app context", () => {
    // `withLiveAppContext` holds the manifest for the whole signing call, so the seam can name
    // the origin at a stage that has no `broadcastConfig`.
    const manifest = (id: string) => ({ id }) as AppManifest;

    const signFailure = async (): Promise<void> => {
      const error = Object.assign(new Error(""), { name: "UserRefusedOnDevice" });
      const bridge = makeBridge({
        signOperation: jest.fn().mockReturnValue(throwError(() => error)),
      });
      const wrapped = await wrapAccountBridge(bridge, "cardano");
      await expect(
        lastValueFrom(
          wrapped.signOperation({
            account,
            transaction: { family: "cardano", mode: "delegate" } as never,
            deviceId: "device",
          }),
        ),
      ).rejects.toBe(error);
    };

    test("reports the manifest that started the signature", async () => {
      await withLiveAppContext(manifest("lido"), signFailure);

      expect(events.find(event => event.status === "failure")).toMatchObject({
        stage: TransactionStage.Sign,
        manifestId: "lido",
      });
    });

    test("reports no manifest for a native in-app signature", async () => {
      await signFailure();

      const failure = events.find(event => event.status === "failure");
      expect(failure).toMatchObject({ stage: TransactionStage.Sign });
      expect(failure?.manifestId).toBeUndefined();
    });

    // The reason this PR exists: the Earn live-app skip keys on the manifest, so without one it
    // could never fire at the sign stage and every device rejection was counted twice.
    test("an Earn live-app sign failure maps to no Segment event", async () => {
      await withLiveAppContext(manifest("earn"), signFailure);

      const failure = events.find(event => event.status === "failure");
      expect(failure?.manifestId).toBe("earn");
      expect(toSegmentTrackEvent(failure!)).toBeNull();
    });

    test("the same failure outside the Earn app still maps to an event", async () => {
      await withLiveAppContext(manifest("lido"), signFailure);

      const failure = events.find(event => event.status === "failure");
      expect(toSegmentTrackEvent(failure!)).toMatchObject({
        event: "earn_transaction_failed",
        properties: expect.objectContaining({ manifest_id: "lido" }),
      });
    });

    // The context is a singleton restored around an await, not an AsyncLocalStorage. Pin the
    // restore, because attribution silently follows whatever it holds. See LIVE-36571.
    test("a nested context restores the outer manifest", async () => {
      await withLiveAppContext(manifest("outer"), async () => {
        await withLiveAppContext(manifest("inner"), signFailure);
        await signFailure();
      });
      await signFailure();

      expect(events.filter(e => e.status === "failure").map(e => e.manifestId)).toEqual([
        "inner",
        "outer",
        undefined,
      ]);
    });
  });

  // Solana is the case that only works because of correlation: its stake actions become a
  // DELEGATE/IN/OUT operation, and it copies no validator into the optimistic operation.
  test("a sign followed by a broadcast reports the transaction's own action and target", async () => {
    const solanaAccount = {
      id: "acc",
      type: "Account",
      currency: { id: "solana", family: "solana", ticker: "SOL" },
    } as unknown as Account;
    const solanaSignedOperation = {
      signature: "sig",
      operation: { type: "DELEGATE", extra: {} },
    } as never;

    const bridge = makeBridge({
      signOperation: jest.fn().mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ type: "signed", signedOperation: solanaSignedOperation });
          subscriber.complete();
        }),
      ),
      broadcast: jest.fn().mockResolvedValue({ id: "op-1" }),
    });
    const wrapped = await wrapAccountBridge(bridge, "solana");

    await lastValueFrom(
      wrapped.signOperation({
        account: solanaAccount,
        transaction: {
          family: "solana",
          model: { kind: "stake.createAccount", uiState: { voteAccAddr: "voteAcc" } },
        } as never,
        deviceId: "device",
      }),
    );
    await wrapped.broadcast({
      account: solanaAccount,
      signedOperation: solanaSignedOperation,
      broadcastConfig: coinModuleSource,
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      status: "intent",
      stage: TransactionStage.Sign,
      earnTransactionType: "delegate",
    });
    expect(events[1]).toMatchObject({
      status: "success",
      earnTransactionType: "delegate",
      // The family's own wording, not the operation type it was flattened to.
      rawTransactionType: "stake.createAccount",
      validators: ["voteAcc"],
      dataSource: "sign",
      // Attribution still comes from the broadcast, which is the only stage that knows it.
      pathway: "send",
    });
    expect(events.map(event => toTxLifecyclePayload(event, "mobile"))).toEqual([
      expect.objectContaining({ event: "tx_intent", path: "native" }),
      expect.objectContaining({ event: "tx_terminal", path: "native", outcome: "success" }),
    ]);
  });

  test("an allow-listed dapp emits intent and terminal while a generic dapp emits neither", async () => {
    const ethereumAccount = {
      id: "acc",
      type: "Account",
      currency: { id: "ethereum", family: "evm", ticker: "ETH" },
    } as unknown as Account;
    const dappSignedOperation = {
      signature: "sig",
      operation: {
        type: "OUT",
        extra: {},
        recipients: ["0xcontract"],
        transactionRaw: { data: "095ea7b3" },
      },
    } as never;
    const bridge = makeBridge({
      signOperation: jest.fn().mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ type: "signed", signedOperation: dappSignedOperation });
          subscriber.complete();
        }),
      ),
      broadcast: jest.fn().mockResolvedValue({ id: "op-1" }),
    });
    const wrapped = await wrapAccountBridge(bridge, "evm");

    await withLiveAppContext({ id: "stakekit" } as AppManifest, async () => {
      await lastValueFrom(
        wrapped.signOperation({
          account: ethereumAccount,
          transaction: {
            family: "ethereum",
            recipient: "0xcontract",
            data: "0x095ea7b3",
          } as never,
          deviceId: "device",
        }),
      );
    });
    await wrapped.broadcast({
      account: ethereumAccount,
      signedOperation: dappSignedOperation,
      broadcastConfig: {
        mevProtected: false,
        source: { type: "dApp", name: "stakekit" },
      },
    });

    expect(events.map(event => toTxLifecyclePayload(event, "desktop"))).toEqual([
      expect.objectContaining({ event: "tx_intent", path: "dapp" }),
      expect.objectContaining({ event: "tx_terminal", path: "dapp", outcome: "success" }),
    ]);

    events = [];
    await withLiveAppContext({ id: "generic-dapp" } as AppManifest, async () => {
      await lastValueFrom(
        wrapped.signOperation({
          account: ethereumAccount,
          transaction: { family: "ethereum", data: "0x095ea7b3" } as never,
          deviceId: "device",
        }),
      );
    });

    expect(events.map(event => toTxLifecyclePayload(event, "desktop"))).toEqual([null]);
  });

  test("signOperation: emits only intent on sign success", async () => {
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

    expect(events).toEqual([
      expect.objectContaining({ status: "intent", stage: TransactionStage.Sign }),
    ]);
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
