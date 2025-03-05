import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { INITIAL_TEST, WalletSyncSettingsNavigator } from "./shared";

describe("WalletSyncSettings", () => {
  it("Should display the ledger sync row", async () => {
    render(<WalletSyncSettingsNavigator />, { overrideInitialState: INITIAL_TEST });
    expect(await screen.findByText(/ledger sync/i)).toBeVisible();
  });

  it("Should open the activation drawer when ledger sync row is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    expect(await screen.findByText(/Turn on Ledger Sync for this phone/i)).toBeVisible();
    expect(await screen.findByText(/I already turned it on/i)).toBeVisible();
  });

  it("Should open the device selection flow when 'Turn on Ledger Sync' is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    expect(await screen.findByText(/Turn on Ledger Sync for this phone/i)).toBeVisible();
    await user.press(await screen.findByRole("button", { name: /Turn on Ledger Sync/i }));
    expect(await screen.findByText(/Choose a Ledger device/i)).toBeVisible();
  });

  it("Should open the drawer when 'I already turned it on' button is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/I already turned it on/i));
    expect(await screen.findByText(/choose your sync method/i)).toBeVisible();
  });
});
