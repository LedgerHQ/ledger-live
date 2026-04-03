import React from "react";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/zcash-shielded/constants";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";

jest.mock("~/renderer/hooks/useAccountUnit");
const mockedUseAccountUnit = jest.mocked(useAccountUnit);
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));
const mockedGetAccountBridge = jest.mocked(getAccountBridge);

// Patch Date.prototype.toLocaleString with explicit typing to avoid "this" implicit any error.
const origDate = global.Date.prototype.toLocaleString;
jest.spyOn(global.Date.prototype, "toLocaleString").mockImplementation(function (this: Date) {
  return origDate.call(this, "en-GB");
});

describe("Bitcoin Account Balance Summary Footer", () => {
  const account = createFixtureAccount();

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("should render estimated time remaining when sync is running and time is non-zero", async () => {
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
            estimatedTimeRemaining: {
              hours: 1,
              minutes: 5,
            },
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("stop-sync-button")).toBeInTheDocument();
      expect(screen.getByText("Estimated time remaining: 01:05")).toBeInTheDocument();
    });
  });

  it("should not render estimated time remaining when sync is running and time is zero", async () => {
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
            estimatedTimeRemaining: {
              hours: 0,
              minutes: 0,
            },
          },
        }}
      />,
      {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("stop-sync-button")).toBeInTheDocument();
      expect(screen.queryByText("Estimated time remaining: 00:00")).not.toBeInTheDocument();
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
    const subscription = { unsubscribe: jest.fn() };
    const syncMock = jest.fn(() => ({
      subscribe: (observer: {
        next: (updater: (account: unknown) => unknown) => void;
        complete: () => void;
      }) => {
        observer.next(updater);
        observer.complete();
        return subscription;
      },
    }));
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
    expect(syncMock).toHaveBeenCalledWith(expect.objectContaining({ id: account.id }), {
      paginationConfig: {},
      syncType: SYNC_TYPE_SHIELDED,
    });
    expect(store.getState().shieldedSyncSubscriptions).toEqual([
      { accountId: account.id, subscription },
    ]);
    expect(logSpy).toHaveBeenCalledWith(`Zcash shielded sync completed on account ${account.id}`);
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
});
