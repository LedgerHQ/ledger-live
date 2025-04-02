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

  it("should display Accounts entry point correctly when criterias are met", async () => {
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

  it("should display Manager entry point correctly when criterias are met", async () => {
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

  it("should display Settings entry point correctly when criterias are met", async () => {
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

  it("should display Onboarding entry point correctly even when no device is eligible", async () => {
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

    const button = screen.getByText(/Sync with another Ledger Live app/);

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

  it("should not display Accounts entry point correctly when criterias are not met", async () => {
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
});
