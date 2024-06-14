import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { TestButtonPage } from "./shared";
import { State } from "~/reducers/types";

describe("AddAccount", () => {
  it("Should open select add account method drawer with Wallet Sync option", async () => {
    const { user } = render(<TestButtonPage />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: { llmWalletSync: { enabled: true } },
          readOnlyModeEnabled: false,
        },
      }),
    });

    const addAssetButton = await screen.findByText(/Add asset/i);

    // Check if the add asset button is visible
    expect(addAssetButton).toBeVisible();

    // Open drawer
    await user.press(addAssetButton);
    expect(await screen.findByText(/Add another account/i)).toBeVisible();
    expect(await screen.findByText(/Add with your Ledger/i)).toBeVisible();
    expect(await screen.findByText(/Import via another Ledger Live app/i)).toBeVisible();

    // On press add with your Ledger
    await user.press(screen.getByText(/Add with your Ledger/i));
    expect(await screen.findByText(/Crypto asset/i)).toBeVisible();
    // IT NEED A FIX ON SOME PACKAGES TO AVOID THE FOLLOWING ERROR :
    /**
     *     SyntaxError: Cannot use import statement outside a module
     */
  });
});
