import React from "react";
import BigNumber from "bignumber.js";
import { Observable, Subscriber } from "rxjs";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { act, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { syncStateUpdater } from "../ZCashExportKeyFlowModal/sync";

jest.mock("~/renderer/hooks/useAccountUnit");
const mockedUseAccountUnit = jest.mocked(useAccountUnit);
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));
jest.mock("../ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn(() => ({ type: "test/syncStateUpdater" })),
}));
const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedSyncStateUpdater = jest.mocked(syncStateUpdater);

const origToLocaleString = global.Date.prototype.toLocaleString;

const makeUtxo = (value: number) => ({
  hash: "",
  outputIndex: 0,
  blockHeight: 1,
  address: "",
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});

describe("Bitcoin Account Balance Summary Footer", () => {
  const account = createFixtureAccount();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global.Date.prototype, "toLocaleString").mockImplementation(function (this: Date) {
      return origToLocaleString.call(this, "en-GB");
    });
  });

  it("should render a private balance field", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{ ...account, currency: { id: "zcash" } as CryptoCurrency }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );
    await waitFor(() => {
      expect(screen.getByText("Available balance")).toBeInTheDocument();
      expect(screen.getByText("Transparent balance")).toBeInTheDocument();
      expect(screen.getByText("Private balance")).toBeInTheDocument();
      expect(screen.getByTestId("show-private-balance-button")).toBeInTheDocument();
    });
  });

  it("should render the start sync button when the sync state is ready", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            syncState: "ready",
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("start-sync-button")).toBeInTheDocument();
      expect(screen.queryByText(/last sync: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/i)).toBeNull();
    });
  });

  it("should render the last sync date when the sync state is complete", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    const now = new Date();

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            syncState: "complete",
            lastSyncTimestamp: now.getTime(),
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );

    await waitFor(() => {
      expect(screen.queryByTestId("start-sync-button")).not.toBeInTheDocument();
      expect(
        screen.getByText(/last sync: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/i),
      ).toBeInTheDocument();
    });
  });

  it("should render the start sync button when the sync state is outdated", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            lastSyncTimestamp: new Date("2026-01-12T10:43:02").getTime(),
            syncState: "outdated",
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("start-sync-button")).toBeInTheDocument();
      expect(screen.getByText(/last sync: 12\/01\/2026 10:43:02/i)).toBeInTheDocument();
    });
  });

  it("should stop shielded sync when sync state is running with no subscription for account", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });
    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            syncState: "running",
          },
        }}
      />,
      {
        initialState: {
          ...withFlagOverrides({ zcashShielded: { enabled: true } }),
          shieldedSyncSubscriptions: [],
        },
      },
    );

    await waitFor(() => {
      expect(mockedSyncStateUpdater).toHaveBeenCalledWith(
        expect.objectContaining({ id: account.id }),
        expect.objectContaining({ syncState: "stopped", progress: 0 }),
      );
    });
  });

  it("should not render a private balance field if the account is not a zcash account", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "BTC",
      name: "Bitcoin",
      magnitude: 8,
    });

    render(<AccountBalanceSummaryFooter account={account} />);
    await waitFor(() => {
      expect(screen.queryByText("Available balance")).not.toBeInTheDocument();
      expect(screen.queryByText("Transparent balance")).not.toBeInTheDocument();
      expect(screen.queryByText("Private balance")).not.toBeInTheDocument();
      expect(screen.queryByTestId("show-private-balance-button")).not.toBeInTheDocument();
    });
  });

  it("should start shielded sync when clicking start sync button", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    const updater = jest.fn();
    // Keep the sync observable open so the subscription stays registered until we
    // explicitly complete it. This lets us assert the subscription is stored
    // before the hook's `complete()` handler removes it.
    let syncSubscriber: Subscriber<(account: unknown) => unknown> | undefined;
    const syncMock = jest.fn(
      () =>
        new Observable<(account: unknown) => unknown>(subscriber => {
          syncSubscriber = subscriber;
          subscriber.next(updater);
        }),
    );
    mockedGetAccountBridge.mockReturnValue({
      sync: syncMock,
    } as unknown as ReturnType<typeof getAccountBridge>);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { user, store } = render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            ufvk: "test-ufvk",
            syncState: "ready",
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );
    await user.click(screen.getByTestId("start-sync-button"));

    expect(mockedGetAccountBridge).toHaveBeenCalledWith(
      expect.objectContaining({ id: account.id }),
    );
    await waitFor(() => {
      expect(syncMock).toHaveBeenCalledWith(expect.objectContaining({ id: account.id }), {
        paginationConfig: {},
        syncType: SYNC_TYPE_SHIELDED,
      });
    });
    expect(store.getState().shieldedSyncSubscriptions).toEqual([
      {
        accountId: account.id,
        subscription: expect.objectContaining({ unsubscribe: expect.any(Function) }),
      },
    ]);

    // Completing the sync should log and drop the stored subscription.
    act(() => {
      syncSubscriber?.complete();
    });
    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(`Zcash shielded sync completed on account ${account.id}`);
    });
    expect(store.getState().shieldedSyncSubscriptions).toEqual([]);
  });

  it("should stop shielded sync and remove subscription when clicking stop sync button", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    const unsubscribe = jest.fn();
    const { user, store } = render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            syncState: "running",
          },
        }}
      />,
      {
        initialState: {
          ...withFlagOverrides({ zcashShielded: { enabled: true } }),
          shieldedSyncSubscriptions: [{ accountId: account.id, subscription: { unsubscribe } }],
        },
      },
    );
    await user.click(screen.getByTestId("stop-sync-button"));

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(store.getState().shieldedSyncSubscriptions).toEqual([]);
  });

  it("shows only the ironwoodBalance as the private balance, excluding the deprecated Orchard/Sapling pools", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          // transparent = own UTXOs (0.1 ZEC); balance = transparent + ironwood
          // total (0.1 + 0.5 ZEC).
          balance: new BigNumber(60_000_000),
          bitcoinResources: { utxos: [makeUtxo(10_000_000)] },
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            orchardBalance: new BigNumber(30_000_000),
            saplingBalance: new BigNumber(20_000_000),
            ironwoodBalance: new BigNumber(50_000_000),
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );

    await waitFor(() => {
      // Private = ironwood (0.5 ZEC); transparent = own UTXOs (0.1 ZEC);
      // available = balance (0.6 ZEC). The residual Orchard/Sapling notes are
      // deliberately not reflected anywhere.
      expect(screen.getByText("0.5 ZEC")).toBeInTheDocument();
      expect(screen.getByText("0.1 ZEC")).toBeInTheDocument();
      expect(screen.getByText("0.6 ZEC")).toBeInTheDocument();
    });
  });

  it("sources the transparent balance from its own UTXOs, not by subtracting the private balance from account.balance", async () => {
    mockedUseAccountUnit.mockReturnValue({
      code: "ZEC",
      name: "Zcash",
      magnitude: 8,
    });

    render(
      <AccountBalanceSummaryFooter
        account={{
          ...account,
          currency: { id: "zcash" } as CryptoCurrency,
          // Stale provenance: `account.balance` (0.9 ZEC) was last written by a
          // different flag state than the current privateInfo. Deriving
          // transparent as balance − ironwood would yield a wrong 0.4 ZEC;
          // sourcing it from the UTXOs keeps it correct at 0.1 ZEC.
          balance: new BigNumber(90_000_000),
          bitcoinResources: { utxos: [makeUtxo(10_000_000)] },
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            ironwoodBalance: new BigNumber(50_000_000),
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );

    await waitFor(() => {
      expect(screen.getByText("0.1 ZEC")).toBeInTheDocument(); // transparent, from UTXOs
      expect(screen.getByText("0.5 ZEC")).toBeInTheDocument(); // private, ironwood
      expect(screen.getByText("0.9 ZEC")).toBeInTheDocument(); // available, balance as-is
      expect(screen.queryByText("0.4 ZEC")).not.toBeInTheDocument(); // never the subtraction result
    });
  });
});
