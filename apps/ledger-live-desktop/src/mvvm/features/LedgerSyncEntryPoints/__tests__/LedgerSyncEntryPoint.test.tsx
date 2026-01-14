/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { INITIAL_STATE, LedgerSyncEntryPointShared } from "./shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { EntryPoint } from "../types";
import { track } from "~/renderer/analytics/segment";

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

describe("LedgerSyncEntryPoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display Accounts entry point correctly when criterias are met", () => {
    render(<LedgerSyncEntryPointShared entryPoint={EntryPoint.accounts} />, {
      initialState: INITIAL_STATE,
    });

    const button = screen.getByText(/Activate Ledger Sync/);

    expect(button).toBeVisible();

    fireEvent.click(button);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("banner_clicked", {
      banner: "Ledger Sync Activation",
      page: "Accounts",
    });

    const activateLedgerSyncDrawer = screen.getByText(/Turn on Ledger Sync for this computer?/);

    expect(activateLedgerSyncDrawer).toBeVisible();
  });

  it("should display Manager entry point correctly when criterias are met", () => {
    render(<LedgerSyncEntryPointShared entryPoint={EntryPoint.manager} />, {
      initialState: INITIAL_STATE,
    });

    const button = screen.getByText(/Turn on Ledger Sync/);

    expect(button).toBeVisible();

    fireEvent.click(button);

    expect(track).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("banner_clicked", {
      banner: "Ledger Sync Activation",
      page: "Manager",
    });

    const activateLedgerSyncDrawer = screen.getByText(/Turn on Ledger Sync for this computer?/);

    expect(activateLedgerSyncDrawer).toBeVisible();
  });

  it("should display Settings entry point correctly when criterias are met", () => {
    render(<LedgerSyncEntryPointShared entryPoint={EntryPoint.settings} />, {
      initialState: INITIAL_STATE,
    });

    const button = screen.getByText(/Turn on Ledger Sync/, { exact: true });

    expect(button).toBeVisible();

    fireEvent.click(button);

    expect(track).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("banner_clicked", {
      banner: "Ledger Sync Activation",
      page: "Settings",
    });

    const activateLedgerSyncDrawer = screen.getByText(/Turn on Ledger Sync for this computer?/);

    expect(activateLedgerSyncDrawer).toBeVisible();
  });

  it("should display Onboarding entry point correctly even when no device is eligible", () => {
    render(
      <LedgerSyncEntryPointShared entryPoint={EntryPoint.onboarding} needEligibleDevice={false} />,
      {
        initialState: {
          ...INITIAL_STATE,
          settings: {
            ...INITIAL_STATE.settings,
            lastSeenDevice: null,
          },
        },
      },
    );

    const button = screen.getByText(/Sync with another Ledger Wallet app/);

    expect(button).toBeVisible();

    fireEvent.click(button);

    expect(track).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("banner_clicked", {
      banner: "Ledger Sync Activation",
      page: "Onboarding",
    });

    const activateLedgerSyncDrawer = screen.getByText(/Turn on Ledger Sync for this computer?/);

    expect(activateLedgerSyncDrawer).toBeVisible();
  });

  it("should display PostOnboarding entry point correctly even when no device is eligible", () => {
    render(
      <LedgerSyncEntryPointShared
        entryPoint={EntryPoint.postOnboarding}
        needEligibleDevice={false}
      />,
      {
        initialState: {
          ...INITIAL_STATE,
          settings: {
            ...INITIAL_STATE.settings,
            lastSeenDevice: null,
          },
        },
      },
    );

    const button = screen.getByText(/Sync with another Ledger Wallet app/);

    expect(button).toBeVisible();

    fireEvent.click(button);

    expect(track).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("banner_clicked", {
      banner: "Ledger Sync Activation",
      page: "PostOnboarding",
    });

    const activateLedgerSyncDrawer = screen.getByText(/Turn on Ledger Sync for this computer?/);

    expect(activateLedgerSyncDrawer).toBeVisible();
  });

  it("should not display PostOnboarding entry point correctly when criterias are not met", () => {
    render(
      <LedgerSyncEntryPointShared
        entryPoint={EntryPoint.postOnboarding}
        needEligibleDevice={false}
      />,
      {
        initialState: {
          ...INITIAL_STATE,
          settings: {
            ...INITIAL_STATE.settings,
            overriddenFeatureFlags: {
              ...INITIAL_STATE.settings.overriddenFeatureFlags,
              lldLedgerSyncEntryPoints: {
                ...INITIAL_STATE.settings.overriddenFeatureFlags.lldLedgerSyncEntryPoints,
                params: {
                  postOnboarding: false,
                },
              },
            },
          },
        },
      },
    );

    const button = screen.queryByText(/Sync with another Ledger Wallet app/);

    expect(button).toBe(null);
  });

  it("should not display Accounts entry point correctly when criterias are not met", () => {
    render(<LedgerSyncEntryPointShared entryPoint={EntryPoint.accounts} />, {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          lastSeenDevice: {
            modelId: DeviceModelId.nanoS,
          } as DeviceModelInfo,
        },
      },
    });

    const button = screen.queryByText(/Activate Ledger Sync/);

    expect(button).toBe(null);
  });

  describe("when lwdLedgerSyncOptimisation feature flag is enabled", () => {
    const OPTIMISATION_ENABLED_STATE = {
      ...INITIAL_STATE,
      settings: {
        ...INITIAL_STATE.settings,
        overriddenFeatureFlags: {
          ...INITIAL_STATE.settings.overriddenFeatureFlags,
          lwdLedgerSyncOptimisation: {
            enabled: true,
          },
        },
      },
    };

    it("should display Manager entry point with LedgerSyncBanner when optimisation is enabled", async () => {
      const { user } = render(<LedgerSyncEntryPointShared entryPoint={EntryPoint.manager} />, {
        initialState: OPTIMISATION_ENABLED_STATE,
      });

      const bannerTitle = screen.getByText(/Your wallet isn't synced/);
      expect(bannerTitle).toBeVisible();

      const bannerDescription = screen.getByText(
        /Keep your portfolio up to date when switching computers or use a phone/,
      );
      expect(bannerDescription).toBeVisible();

      const syncButton = screen.getByRole("button", { name: "Sync my wallet" });
      expect(syncButton).toBeVisible();

      await user.click(syncButton);

      expect(track).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("banner_clicked", {
        banner: "Ledger Sync Activation",
        page: "Manager",
      });
    });

    it("should display Accounts entry point with LedgerSyncBanner when optimisation is enabled", async () => {
      const { user } = render(<LedgerSyncEntryPointShared entryPoint={EntryPoint.accounts} />, {
        initialState: OPTIMISATION_ENABLED_STATE,
      });

      const bannerTitle = screen.getByText(/Your wallet isn't synced/);
      expect(bannerTitle).toBeVisible();

      const bannerDescription = screen.getByText(
        /Keep your portfolio up to date when switching computers or use a phone/,
      );
      expect(bannerDescription).toBeVisible();

      const syncButton = screen.getByRole("button", { name: "Sync my wallet" });
      expect(syncButton).toBeVisible();

      await user.click(syncButton);

      expect(track).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("banner_clicked", {
        banner: "Ledger Sync Activation",
        page: "Accounts",
      });
    });

    it("should display Settings entry point with LedgerSyncBanner when optimisation is enabled", async () => {
      const { user } = render(<LedgerSyncEntryPointShared entryPoint={EntryPoint.settings} />, {
        initialState: OPTIMISATION_ENABLED_STATE,
      });

      const bannerTitle = screen.getByText(/Your wallet isn't synced/);
      expect(bannerTitle).toBeVisible();

      const bannerDescription = screen.getByText(
        /Keep your portfolio up to date when switching computers or use a phone/,
      );
      expect(bannerDescription).toBeVisible();

      const syncButton = screen.getByRole("button", { name: "Sync my wallet" });
      expect(syncButton).toBeVisible();

      await user.click(syncButton);

      expect(track).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("banner_clicked", {
        banner: "Ledger Sync Activation",
        page: "Settings",
      });
    });
  });
});
