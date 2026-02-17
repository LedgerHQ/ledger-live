import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import {
  TestQuickActionsWrapper,
  overrideStateWithFunds,
  overrideStateWithoutFunds,
  overrideStateNoSigner,
  overrideStateReadOnly,
  getCtaButtons,
  getNoSignerCtaButtons,
} from "./shared";
import { QUICK_ACTIONS_TEST_IDS } from "../testIds";

const { transferDrawer } = QUICK_ACTIONS_TEST_IDS;

describe("QuickActionsCtas Integration Tests", () => {
  describe("Has Funds State", () => {
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

    it("should enable all buttons when user has funds", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateWithFunds,
      });

      const { transferButton, swapButton, buyButton } = await getCtaButtons();

      expect(transferButton).toBeEnabled();
      expect(swapButton).toBeEnabled();
      expect(buyButton).toBeEnabled();
    });
  });

  describe("No Funds State", () => {
    it("should display Transfer, Swap, Buy buttons for no-funds users", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateWithoutFunds,
      });

      const { transferButton, swapButton, buyButton } = await getCtaButtons();

      expect(transferButton).toBeVisible();
      expect(swapButton).toBeVisible();
      expect(buyButton).toBeVisible();
    });

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
  });

  describe("No Signer State (Reborn)", () => {
    it("should display Connect and Buy a Ledger buttons for no-signer users", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateNoSigner,
      });

      const { connectButton, buyLedgerButton } = await getNoSignerCtaButtons();

      expect(connectButton).toBeVisible();
      expect(connectButton).toHaveTextContent(/connect/i);

      expect(buyLedgerButton).toBeVisible();
      expect(buyLedgerButton).toHaveTextContent(/buy a ledger/i);
    });

    it("should enable both Connect and Buy a Ledger buttons", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateNoSigner,
      });

      const { connectButton, buyLedgerButton } = await getNoSignerCtaButtons();

      expect(connectButton).toBeEnabled();
      expect(buyLedgerButton).toBeEnabled();
    });

    it("should not display standard Transfer, Swap, Buy buttons for no-signer users", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateNoSigner,
      });

      await screen.findByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container);

      expect(screen.queryByTestId(QUICK_ACTIONS_TEST_IDS.ctas.transfer)).toBeNull();
      expect(screen.queryByTestId(QUICK_ACTIONS_TEST_IDS.ctas.swap)).toBeNull();
      expect(screen.queryByTestId(QUICK_ACTIONS_TEST_IDS.ctas.buy)).toBeNull();
    });

    it("should display no-signer buttons even when user has funds in read-only mode", async () => {
      render(<TestQuickActionsWrapper />, {
        overrideInitialState: overrideStateReadOnly,
      });

      // In read-only mode, no-signer state takes precedence over having funds
      const { connectButton, buyLedgerButton } = await getNoSignerCtaButtons();

      expect(connectButton).toBeVisible();
      expect(buyLedgerButton).toBeVisible();

      // Standard buttons should not be displayed
      expect(screen.queryByTestId(QUICK_ACTIONS_TEST_IDS.ctas.transfer)).toBeNull();
      expect(screen.queryByTestId(QUICK_ACTIONS_TEST_IDS.ctas.swap)).toBeNull();
      expect(screen.queryByTestId(QUICK_ACTIONS_TEST_IDS.ctas.buy)).toBeNull();
    });
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
});
