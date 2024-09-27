/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import { initialStateWalletSync } from "~/renderer/reducers/walletSync";
import { WalletSyncTestApp, lldWalletSyncFeatureFlag, mockedSdk } from "./shared";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    getMembers: (mockedSdk.getMembers = jest.fn()),
    removeMember: (mockedSdk.removeMember = jest.fn()),
    initMemberCredentials: (mockedSdk.initMemberCredentials = jest.fn()),
  }),
}));

describe("Rendering", () => {
  it("should loads and displays WalletSync Row", async () => {
    render(<WalletSyncTestApp />);
    expect(screen.getByRole("button", { name: "Manage" })).toBeTruthy();
  });

  it("should open drawer and display Wallet Sync Activation flow with learnMore link", async () => {
    const { user, store } = render(<WalletSyncTestApp />, {
      initialState: {
        walletSync: initialStateWalletSync,
        settings: {
          ...INITIAL_STATE_SETTINGS,
          overriddenFeatureFlags: lldWalletSyncFeatureFlag,
        },
      },
    });
    const button = screen.getByRole("button", { name: "Manage" });

    await user.click(button);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Turn on Ledger Sync" })).toBeDefined(),
    );

    expect(screen.getByText("I already turned it on")).toBeDefined();
    expect(store.getState().settings.overriddenFeatureFlags.lldWalletSync.enabled).toBe(true);
    expect(screen.getByText(/How does Ledger Sync work?/i)).toBeDefined();
  });

  it("should open drawer and display Wallet Sync Activation flow without learnMore link", async () => {
    const { user, store } = render(<WalletSyncTestApp />, {
      initialState: {
        walletSync: initialStateWalletSync,
      },
    });
    const button = screen.getByRole("button", { name: "Manage" });

    await user.click(button);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Turn on Ledger Sync" })).toBeDefined(),
    );

    expect(screen.getByText("I already turned it on")).toBeDefined();
    expect(store.getState().settings.overriddenFeatureFlags.lldWalletSync).toBe(undefined);
    expect(screen.queryByText(/How does Ledger Sync work?/i)).toBeNull();
  });
});
