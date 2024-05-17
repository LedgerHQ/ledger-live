/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from "@jest/globals";

import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import "@testing-library/jest-dom";
import { WalletSyncPages } from "../setupTests/shared";

describe("Rendering", () => {
  it("should loads and displays WalletSync Row", async () => {
    render(<WalletSyncPages />);
    expect(screen.getByRole("button", { name: "Manage" })).toBeTruthy();
  });

  it("should open drawer and display Wallet Sync Activation flow", async () => {
    const { user } = render(<WalletSyncPages />);
    const button = screen.getByRole("button", { name: "Manage" });

    await user.click(button);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Create a backup" })).toBeDefined(),
    );

    expect(screen.getByRole("button", { name: "Synchronize" })).toBeDefined();
  });
});
