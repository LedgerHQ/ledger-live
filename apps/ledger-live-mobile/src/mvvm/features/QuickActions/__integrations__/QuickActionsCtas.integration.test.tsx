import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import {
  TestQuickActionsWrapper,
  overrideStateWithFunds,
  overrideStateWithoutFunds,
  overrideStateReadOnly,
  getCtaButtons,
} from "./shared";
import { QUICK_ACTIONS_TEST_IDS } from "../testIds";
import { State } from "~/reducers/types";

const { transferDrawer } = QUICK_ACTIONS_TEST_IDS;

describe("QuickActionsCtas Integration Tests", () => {
  it("should display all three quick action buttons with correct labels", async () => {
    render(<TestQuickActionsWrapper />, {
      overrideInitialState: overrideStateWithFunds,
    });

    const { transferButton, swapButton, buyButton } = await getCtaButtons();

    expect(transferButton).toBeVisible();
    expect(transferButton).toHaveTextContent(/transfer/i);

    expect(swapButton).toBeVisible();
    expect(swapButton).toHaveTextContent(/swap/i);

    expect(buyButton).toBeVisible();
    expect(buyButton).toHaveTextContent(/buy/i);
  });

  describe("Transfer Action", () => {
    it("should open transfer drawer when transfer button is pressed", async () => {
      const { user } = render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateWithFunds,
      });

      const { transferButton } = await getCtaButtons();
      await user.press(transferButton);

      await waitFor(() => {
        expect(screen.getByTestId(transferDrawer.container)).toBeVisible();
      });
    });

    it("should display all transfer options in drawer", async () => {
      const { user } = render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateWithFunds,
      });

      const { transferButton } = await getCtaButtons();
      await user.press(transferButton);

      await waitFor(() => {
        expect(screen.getByTestId(transferDrawer.receive)).toBeVisible();
        expect(screen.getByTestId(transferDrawer.send)).toBeVisible();
        expect(screen.getByTestId(transferDrawer.bankTransfer)).toBeVisible();
      });
    });
  });

  describe("Disabled States", () => {
    it("should enable transfer but disable swap when user has no funds", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateWithoutFunds,
      });

      const { transferButton, swapButton, buyButton } = await getCtaButtons();

      expect(transferButton).toBeEnabled();
      expect(swapButton).toBeDisabled();
      expect(buyButton).toBeEnabled();
    });

    it("should disable send option in transfer drawer when user has no funds", async () => {
      const { user } = render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateWithoutFunds,
      });

      const { transferButton } = await getCtaButtons();
      await user.press(transferButton);

      await waitFor(() => {
        expect(screen.getByTestId(transferDrawer.receive)).toBeEnabled();
        expect(screen.getByTestId(transferDrawer.send)).toBeDisabled();
        expect(screen.getByTestId(transferDrawer.bankTransfer)).toBeEnabled();
      });
    });

    it("should disable all actions when in read-only mode", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateReadOnly,
      });

      const { transferButton, swapButton, buyButton } = await getCtaButtons();

      expect(transferButton).toBeDisabled();
      expect(swapButton).toBeDisabled();
      expect(buyButton).toBeDisabled();
    });

    it("should not display bank transfer option in transfer drawer when noah feature flag is disabled", async () => {
      const { user } = render(<TestQuickActionsWrapper />, {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              ...state.settings.overriddenFeatureFlags,
              noah: { enabled: false },
            },
          },
        }),
      });

      const { transferButton } = await getCtaButtons();
      await user.press(transferButton);

      expect(screen.queryByTestId(transferDrawer.bankTransfer)).not.toBeVisible();
    });
  });
});
