/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { describe, it, expect } from "@jest/globals";

import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

const WalletSyncTestApp = () => (
  <>
    <div id="modals"></div>
    <WalletSyncRow />
  </>
);

describe("Rendering", () => {
  it("should loads and displays WalletSync Row", async () => {
    render(<WalletSyncTestApp />);
    expect(screen.getByRole("button", { name: "Manage" })).toBeTruthy();
  });

  it("should open drawer and display Wallet Sync Activation flow", async () => {
    const { user } = render(<WalletSyncTestApp />, {
      initialState: {
        walletSync: {
          activated: false,
          flow: Flow.Activation,
          step: Step.CreateOrSynchronizeStep,
        },
      },
    });
    const button = screen.getByRole("button", { name: "Manage" });

    await user.click(button);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Create a backup" })).toBeDefined(),
    );

    expect(screen.getByRole("button", { name: "Synchronize" })).toBeDefined();
  });
});
