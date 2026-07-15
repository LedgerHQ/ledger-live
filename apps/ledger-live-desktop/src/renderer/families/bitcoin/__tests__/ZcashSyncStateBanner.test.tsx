import React from "react";
import { Observable } from "rxjs";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/constants";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { syncStateUpdater } from "../ZCashExportKeyFlowModal/sync";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import ZcashSyncStateBanner from "../ZcashSyncStateBanner";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));
jest.mock("../ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn(() => ({ type: "test/syncStateUpdater" })),
}));

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
// Suppress unused warning — imported for type purity in mock assertion contexts
void syncStateUpdater;

const baseAccount = createFixtureAccount();

const buildAccount = (overrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {}) =>
  ({
    ...baseAccount,
    currency: { id: "zcash" } as CryptoCurrency,
    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ...overrides,
    },
  }) as unknown as ZcashAccount;

const renderBanner = (
  account: ZcashAccount,
  sender: "public" | "private" | undefined,
  flagEnabled = true,
) =>
  render(<ZcashSyncStateBanner account={account} sender={sender} />, {
    initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }),
  });

describe("ZcashSyncStateBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when the zcashShielded flag is off", () => {
    renderBanner(buildAccount({ syncState: "stopped" }), "private", false);
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
  });

  it("renders nothing when sender is public", () => {
    renderBanner(buildAccount({ syncState: "stopped" }), "public");
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
  });

  it("renders nothing when sender is undefined", () => {
    renderBanner(buildAccount({ syncState: "stopped" }), undefined);
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
  });

  it("stopped state + private sender renders warning banner with Resume sync button", () => {
    renderBanner(buildAccount({ syncState: "stopped" }), "private");
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeInTheDocument();
    expect(screen.getByTestId("zcash-resume-sync-button")).toBeInTheDocument();
  });

  it("disabled state (default) + private sender renders the same warning banner as stopped", () => {
    renderBanner(buildAccount(), "private");
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeInTheDocument();
    expect(screen.getByTestId("zcash-resume-sync-button")).toBeInTheDocument();
  });

  it("running state + private sender renders progress banner with percentage", () => {
    renderBanner(buildAccount({ syncState: "running", progress: 42 }), "private");
    expect(screen.getByTestId("zcash-sync-banner-running")).toBeInTheDocument();
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });

  it("running state with non-zero estimated time shows time remaining", () => {
    renderBanner(
      buildAccount({
        syncState: "running",
        estimatedTimeRemaining: { hours: 1, minutes: 5 },
      }),
      "private",
    );
    expect(screen.getByText(/01:05/)).toBeInTheDocument();
  });

  it("running state with zero estimated time hides time remaining", () => {
    renderBanner(
      buildAccount({
        syncState: "running",
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
      }),
      "private",
    );
    expect(screen.queryByText(/Estimated time/)).not.toBeInTheDocument();
  });

  it("outdated state + private sender renders hint banner with Sync balance button", () => {
    renderBanner(buildAccount({ syncState: "outdated" }), "private");
    expect(screen.getByTestId("zcash-sync-banner-outdated")).toBeInTheDocument();
    expect(screen.getByTestId("zcash-sync-balance-button")).toBeInTheDocument();
  });

  it("complete state + private sender renders no banner", () => {
    renderBanner(buildAccount({ syncState: "complete" }), "private");
    expect(screen.queryByTestId("zcash-sync-banner-stopped")).not.toBeInTheDocument();
    expect(screen.queryByTestId("zcash-sync-banner-running")).not.toBeInTheDocument();
    expect(screen.queryByTestId("zcash-sync-banner-outdated")).not.toBeInTheDocument();
  });

  it("clicking Resume sync calls getAccountBridge with SYNC_TYPE_SHIELDED", async () => {
    const syncMock = jest.fn(
      () =>
        new Observable<(account: unknown) => unknown>(subscriber => {
          subscriber.next(jest.fn());
          subscriber.complete();
        }),
    );
    mockedGetAccountBridge.mockReturnValue({
      sync: syncMock,
    } as unknown as ReturnType<typeof getAccountBridge>);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const account = buildAccount({ syncState: "stopped", ufvk: "test-ufvk" });
    const { user } = renderBanner(account, "private");

    await user.click(screen.getByTestId("zcash-resume-sync-button"));

    expect(mockedGetAccountBridge).toHaveBeenCalledWith(
      expect.objectContaining({ id: account.id }),
    );
    await waitFor(() => {
      expect(syncMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: account.id }),
        expect.objectContaining({ syncType: SYNC_TYPE_SHIELDED }),
      );
    });

    logSpy.mockRestore();
  });

  it("clicking Sync balance on outdated banner calls getAccountBridge with SYNC_TYPE_SHIELDED", async () => {
    const syncMock = jest.fn(
      () =>
        new Observable<(account: unknown) => unknown>(subscriber => {
          subscriber.next(jest.fn());
          subscriber.complete();
        }),
    );
    mockedGetAccountBridge.mockReturnValue({
      sync: syncMock,
    } as unknown as ReturnType<typeof getAccountBridge>);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const account = buildAccount({ syncState: "outdated", ufvk: "test-ufvk" });
    const { user } = renderBanner(account, "private");

    await user.click(screen.getByTestId("zcash-sync-balance-button"));

    expect(mockedGetAccountBridge).toHaveBeenCalledWith(
      expect.objectContaining({ id: account.id }),
    );
    await waitFor(() => {
      expect(syncMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: account.id }),
        expect.objectContaining({ syncType: SYNC_TYPE_SHIELDED }),
      );
    });

    logSpy.mockRestore();
  });

  it("no button rendered by the banner is disabled", () => {
    renderBanner(buildAccount({ syncState: "stopped" }), "private");
    const banner = screen.getByTestId("zcash-sync-banner-stopped");
    const buttons = banner.querySelectorAll("button");
    buttons.forEach(btn => {
      expect(btn).not.toBeDisabled();
    });
  });
});
