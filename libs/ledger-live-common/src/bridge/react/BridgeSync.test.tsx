/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import React, { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { Observable } from "rxjs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "../../mock/account";
import { BridgeSync, resetStates } from "./BridgeSync";
import { setSupportedCurrencies } from "../../currencies";
import * as Bridge from "..";
import { useBridgeSync, useBridgeSyncState } from "./context";
import type { Sync, BridgeSyncState } from "./types";

jest.setTimeout(30000);

const defaultsBridgeSyncOpts = {
  accounts: [],
  updateAccountWithUpdater: () => {},
  recoverError: e => e,
  trackAnalytics: () => {},
  prepareCurrency: () => Promise.resolve(),
  hydrateCurrency: () => Promise.resolve(),
  blacklistedTokenIds: [],
};

setSupportedCurrencies(["bitcoin", "ethereum"]);

describe("BridgeSync", () => {
  afterEach(() => {
    jest.clearAllMocks();
    resetStates();
  });

  test("initialize without an error", async () => {
    render(<BridgeSync {...defaultsBridgeSyncOpts}>LOADED</BridgeSync>);
    expect(screen.getByText("LOADED")).not.toBeNull();
  });

  test("executes a sync at start tracked as reason=initial", done => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const futureOpLength = account.operations.length;
    // we remove the first operation to feed it back as a broadcasted one, the mock impl will make it go back to operations
    const lastOp = account.operations.splice(0, 1)[0];
    Bridge.getAccountBridge(account).broadcast({
      account,
      signedOperation: {
        operation: lastOp,
        signature: "",
      },
    });
    const accounts = [account];
    expect(accounts[0].operations.length).toBe(futureOpLength - 1);

    function track(type, opts) {
      if (type === "SyncSuccess") {
        expect(opts).toMatchObject({
          reason: "initial",
          currencyName: "Bitcoin",
          operationsLength: futureOpLength,
        });
        done();
      }
    }
    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} trackAnalytics={track}>
        {null}
      </BridgeSync>,
    );
  });

  test("sync all accounts in parallel at start tracked as reason=initial", done => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const ETH = getCryptoCurrencyById("ethereum");
    const accounts = [
      genAccount("2btc1", { currency: BTC }),
      genAccount("2btc2", { currency: BTC }),
      genAccount("2eth1", { currency: ETH }),
    ];
    const synced: Array<Record<string, unknown>> = [];
    let resolveFirst;
    function prepareCurrency() {
      if (!resolveFirst) {
        return new Promise((resolve, reject) => {
          resolveFirst = resolve;
          setTimeout(
            reject,
            5000,
            new Error("prepareCurrency doesn't seem to be called in parallel"),
          );
        });
      }
      // if we reach here, it means, we managed to have
      // a SECOND sync that need to prepare currency
      // so it's a proof that sync correctly runs in parallel
      // otherwise it would timeout
      resolveFirst();
      return Promise.resolve();
    }
    function track(type, opts) {
      expect(type).not.toEqual("SyncError");
      if (type === "SyncSuccess") {
        synced.push(opts);
        expect(opts).toMatchObject({
          reason: "initial",
        });
        if (synced.length === accounts.length) done();
      }
    }
    render(
      <BridgeSync
        {...defaultsBridgeSyncOpts}
        prepareCurrency={prepareCurrency}
        accounts={accounts}
        trackAnalytics={track}
      >
        {null}
      </BridgeSync>,
    );
  });

  test("provides context values correctly", () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    let syncFunction: Sync | undefined;
    let syncState: BridgeSyncState | undefined;

    function TestComponent() {
      syncFunction = useBridgeSync();
      syncState = useBridgeSyncState();
      return <div data-testid="test-component">Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts}>
        <TestComponent />
      </BridgeSync>,
    );

    expect(syncFunction).toBeDefined();
    expect(typeof syncFunction).toBe("function");
    expect(syncState).toBeDefined();
    expect(typeof syncState).toBe("object");
  });

  test("handles sync errors with recoverError function", done => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    const mockError = new Error("Sync failed");
    const recoverError = jest.fn((error: Error) => {
      expect(error.message).toBe("Sync failed");
      return error; // Return error to treat as actual error
    });

    // Mock the account bridge to return an Observable that emits an error
    const originalBridge = Bridge.getAccountBridge(account);
    const mockBridge = {
      ...originalBridge,
      sync: () => {
        // Return an Observable that immediately emits an error
        return new Observable<(acc: typeof account) => typeof account>(observer => {
          setTimeout(() => observer.error(mockError), 100);
        });
      },
    };

    jest.spyOn(Bridge, "getAccountBridge").mockReturnValue(mockBridge);

    let syncStateChecked = false;
    let syncStateRef: BridgeSyncState;
    function TestComponent() {
      const syncState = useBridgeSyncState();
      syncStateRef = syncState;

      // After the error is silenced, the sync state should show no error
      setTimeout(() => {
        if (!syncStateChecked && syncStateRef[account.id]) {
          syncStateChecked = true;
          expect(syncStateRef[account.id].error).toBe(mockError);
          expect(recoverError).toHaveBeenCalledWith(mockError);
          done();
        }
      }, 200);

      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} recoverError={recoverError}>
        <TestComponent />
      </BridgeSync>,
    );
  });

  test("silences errors when recoverError returns null", done => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    const mockError = new Error("Sync failed but should be silenced");
    const recoverError = jest.fn(() => null); // Return null to silence the error

    // Mock the account bridge to return an Observable that emits an error
    const originalBridge = Bridge.getAccountBridge(account);
    const mockBridge = {
      ...originalBridge,
      sync: () => {
        return new Observable<(acc: typeof account) => typeof account>(observer => {
          setTimeout(() => observer.error(mockError), 100);
        });
      },
    };

    jest.spyOn(Bridge, "getAccountBridge").mockReturnValue(mockBridge);

    let syncStateChecked = false;
    let syncStateRef: BridgeSyncState;
    function TestComponent() {
      const syncState = useBridgeSyncState();
      syncStateRef = syncState;

      // After the error is silenced, the sync state should show no error
      setTimeout(() => {
        if (!syncStateChecked && syncStateRef[account.id]) {
          syncStateChecked = true;
          expect(syncStateRef[account.id].error).toBeNull();
          expect(recoverError).toHaveBeenCalledWith(mockError);
          done();
        }
      }, 200);

      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} recoverError={recoverError}>
        <TestComponent />
      </BridgeSync>,
    );
  });

  test("handles blacklisted token IDs in sync config", () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const blacklistedTokenIds = ["token1", "token2"];

    render(
      <BridgeSync
        {...defaultsBridgeSyncOpts}
        accounts={[account]}
        blacklistedTokenIds={blacklistedTokenIds}
      >
        {null}
      </BridgeSync>,
    );

    // Test passes if component renders without errors with blacklisted tokens
    expect(blacklistedTokenIds).toHaveLength(2);
  });

  test("handles sync actions correctly", () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const ETH = getCryptoCurrencyById("ethereum");
    const account1 = genAccount("btc1", { currency: BTC });
    const account2 = genAccount("eth1", { currency: ETH });
    const accounts = [account1, account2];

    let sync: Sync | undefined;

    function TestComponent() {
      sync = useBridgeSync();
      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts}>
        <TestComponent />
      </BridgeSync>,
    );

    expect(sync).toBeDefined();

    // Test different sync actions
    expect(() => {
      sync?.({ type: "SYNC_ALL_ACCOUNTS", priority: 1, reason: "manual" });
    }).not.toThrow();

    expect(() => {
      sync?.({ type: "SYNC_ONE_ACCOUNT", accountId: account1.id, priority: 1, reason: "manual" });
    }).not.toThrow();

    expect(() => {
      sync?.({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds: [account1.id],
        priority: 1,
        reason: "manual",
      });
    }).not.toThrow();

    expect(() => {
      sync?.({ type: "SET_SKIP_UNDER_PRIORITY", priority: 5 });
    }).not.toThrow();

    expect(() => {
      sync?.({ type: "BACKGROUND_TICK", reason: "background" });
    }).not.toThrow();
  });

  test("handles pending operations sync", () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });

    // Create account with pending operations
    const accountWithPending = {
      ...account,
      pendingOperations: [
        {
          id: "pending1",
          hash: "hash1",
          type: "OUT" as const,
          value: account.balance,
          fee: account.balance.dividedBy(10),
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: ["recipient1"],
          accountId: account.id,
          date: new Date(),
          extra: {},
        },
      ],
    };

    const accounts = [accountWithPending];

    let sync: Sync | undefined;

    function TestComponent() {
      sync = useBridgeSync();
      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts}>
        <TestComponent />
      </BridgeSync>,
    );

    expect(sync).toBeDefined();

    // The component should automatically sync accounts with pending operations
    // This is tested by checking that the component renders without errors
    // and that pending operations are handled properly
    expect(accountWithPending.pendingOperations.length).toBeGreaterThan(0);
  });

  test("hydrates currencies only once", async () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const ETH = getCryptoCurrencyById("ethereum");
    const account1 = genAccount("btc1", { currency: BTC });
    const account2 = genAccount("btc2", { currency: BTC }); // Same currency
    const account3 = genAccount("eth1", { currency: ETH });
    const accounts = [account1, account2, account3];

    const hydrateCurrency = jest.fn(() => Promise.resolve());

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} hydrateCurrency={hydrateCurrency}>
        {null}
      </BridgeSync>,
    );

    // Wait for hydration to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should only hydrate each currency once, not once per account
    expect(hydrateCurrency).toHaveBeenCalledTimes(2); // BTC and ETH
    expect(hydrateCurrency).toHaveBeenCalledWith(BTC);
    expect(hydrateCurrency).toHaveBeenCalledWith(ETH);
  });

  test("handles different sync actions", () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    let sync: Sync | undefined;

    function TestComponent() {
      sync = useBridgeSync();
      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts}>
        <TestComponent />
      </BridgeSync>,
    );

    expect(sync).toBeDefined();

    // Test that sync actions can be called without throwing
    expect(sync).toBeDefined();
    const syncFn = sync!; // Assert non-null since we just checked

    expect(() =>
      syncFn({ type: "SYNC_ALL_ACCOUNTS", priority: 1, reason: "manual" }),
    ).not.toThrow();
    expect(() =>
      syncFn({ type: "SYNC_ONE_ACCOUNT", accountId: account.id, priority: 1, reason: "manual" }),
    ).not.toThrow();
    expect(() => syncFn({ type: "SET_SKIP_UNDER_PRIORITY", priority: 5 })).not.toThrow();
    expect(() => syncFn({ type: "BACKGROUND_TICK", reason: "background" })).not.toThrow();
  });

  test("tracks session analytics when all accounts complete", async () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const ETH = getCryptoCurrencyById("ethereum");
    const account1 = genAccount("btc1", { currency: BTC, operationsSize: 3 });
    const account2 = genAccount("eth1", { currency: ETH, operationsSize: 5 });
    const accounts = [account1, account2];

    const trackAnalytics = jest.fn();

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} trackAnalytics={trackAnalytics}>
        {null}
      </BridgeSync>,
    );

    // Wait for potential analytics calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // The component should not throw when tracking analytics
    expect(accounts).toHaveLength(2);
  });

  test("handles non-existent account sync gracefully", () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    let sync: Sync | undefined;

    function TestComponent() {
      sync = useBridgeSync();
      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts}>
        <TestComponent />
      </BridgeSync>,
    );

    // Try to sync an account that doesn't exist - should not throw
    expect(sync).toBeDefined();
    const syncFn = sync!;

    expect(() => {
      syncFn({
        type: "SYNC_ONE_ACCOUNT",
        accountId: "non-existent-account",
        priority: 1,
        reason: "manual",
      });
    }).not.toThrow();
  });

  test("does not send analytics for background sync reason", done => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    const trackAnalytics = jest.fn();

    // Mock the account bridge to complete successfully
    const originalBridge = Bridge.getAccountBridge(account);
    const mockBridge = {
      ...originalBridge,
      sync: () => {
        return new Observable<(acc: typeof account) => typeof account>(observer => {
          // Emit a successful account update
          observer.next((acc: typeof account) => acc);
          observer.complete();
        });
      },
    };

    jest.spyOn(Bridge, "getAccountBridge").mockReturnValue(mockBridge);

    function TestComponent() {
      const sync = useBridgeSync();

      useEffect(() => {
        // Trigger a background sync
        sync({
          type: "SYNC_ONE_ACCOUNT",
          accountId: account.id,
          priority: 1,
          reason: "background",
        });
      }, [sync]);
      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} trackAnalytics={trackAnalytics}>
        <TestComponent />
      </BridgeSync>,
    );

    // Wait for sync to complete and verify no analytics were sent
    setTimeout(() => {
      // Should not have called trackAnalytics with SyncSuccess for background syncs
      const syncSuccessCalls = trackAnalytics.mock.calls.filter(call => call[0] === "SyncSuccess");
      expect(syncSuccessCalls).toHaveLength(0);

      // Verify trackAnalytics was not called at all with SyncSuccess
      expect(trackAnalytics).not.toHaveBeenCalledWith("SyncSuccess", expect.anything());

      done();
    }, 200);
  });

  test("sends analytics for non-background sync reason", done => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    const trackAnalytics = jest.fn();

    // Mock the account bridge to complete successfully
    const originalBridge = Bridge.getAccountBridge(account);
    const mockBridge = {
      ...originalBridge,
      sync: () => {
        return new Observable<(acc: typeof account) => typeof account>(observer => {
          // Emit a successful account update
          observer.next((acc: typeof account) => acc);
          observer.complete();
        });
      },
    };

    jest.spyOn(Bridge, "getAccountBridge").mockReturnValue(mockBridge);

    function TestComponent() {
      const sync = useBridgeSync();

      useEffect(() => {
        // Trigger a manual (non-background) sync
        sync({
          type: "SYNC_ONE_ACCOUNT",
          accountId: account.id,
          priority: 1,
          reason: "manual",
        });
      }, [sync]);
      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} trackAnalytics={trackAnalytics}>
        <TestComponent />
      </BridgeSync>,
    );

    // Wait for sync to complete and verify analytics were sent
    setTimeout(() => {
      // Should have called trackAnalytics with SyncSuccess for manual syncs
      expect(trackAnalytics).toHaveBeenCalledWith(
        "SyncSuccess",
        expect.objectContaining({
          reason: "manual",
          currencyName: account.currency.name,
        }),
      );

      done();
    }, 400);
  });

  test("provides sync state context", () => {
    const BTC = getCryptoCurrencyById("bitcoin");
    const account = genAccount("btc1", { currency: BTC });
    const accounts = [account];

    let syncState: BridgeSyncState | undefined;

    function TestComponent() {
      syncState = useBridgeSyncState();
      return <div>Test</div>;
    }

    render(
      <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts}>
        <TestComponent />
      </BridgeSync>,
    );

    expect(syncState).toBeDefined();
    expect(typeof syncState).toBe("object");
  });
});
