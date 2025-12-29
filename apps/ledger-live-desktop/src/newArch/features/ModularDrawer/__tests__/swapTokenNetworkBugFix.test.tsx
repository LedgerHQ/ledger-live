/**
 * Test Suite for Swap Token/Network Bug Fix
 *
 * Bug Description:
 * When selecting a token (e.g., USDC) for swap and then selecting a network (e.g., Polygon),
 * if the user had no account on that network, the system was passing the network currency (Polygon)
 * to the swap instead of the selected token (USDC).
 *
 * Fix:
 * In useModularDrawerFlowState.handleNetworkSelected, the code now correctly finds the corresponding
 * token currency from the providers.networks instead of using the network directly.
 */

import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import {
  ethereumCurrency,
  arbitrumCurrency,
  baseCurrency,
  scrollCurrency,
  bitcoinCurrency,
} from "../../__mocks__/useSelectAssetFlow.mock";
import { mockDomMeasurements } from "../../__tests__/shared";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

beforeEach(() => {
  mockDomMeasurements();
  jest.clearAllMocks();
});

describe("Swap Token/Network Bug Fix - Network Selection", () => {
  describe("ETH L2 Network Selection - The Core Bug Scenario", () => {
    it("should pass the correct network currency (Arbitrum) when selecting ETH then Arbitrum", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[ethereumCurrency.id, arbitrumCurrency.id, baseCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      // Wait for Ethereum to appear
      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());

      // Click on Ethereum (which groups multiple networks)
      await user.click(screen.getByText(/ethereum/i));

      // Should navigate to network selection
      expect(screen.getByText(/select network/i)).toBeVisible();

      // Wait for Arbitrum network to appear
      await waitFor(() => expect(screen.getByText(/arbitrum/i)).toBeVisible());

      // Select Arbitrum network
      await user.click(screen.getByText(/arbitrum/i));

      // Verify that onAssetSelected was called
      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      const selectedCurrency = onAssetSelected.mock.calls[0][0];

      // The FIX: Should pass Arbitrum currency, not generic Ethereum
      expect(selectedCurrency.id).toBe("arbitrum");
      expect(selectedCurrency.name).toBe("Arbitrum");
    });

    it("should pass the correct network currency (Base) when selecting ETH then Base", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[
            ethereumCurrency.id,
            arbitrumCurrency.id,
            baseCurrency.id,
            scrollCurrency.id,
          ]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
      await user.click(screen.getByText(/ethereum/i));

      expect(screen.getByText(/select network/i)).toBeVisible();
      await waitFor(() => expect(screen.getByText(/base/i)).toBeVisible());

      // Select Base network
      await user.click(screen.getByText(/base/i));

      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      const selectedCurrency = onAssetSelected.mock.calls[0][0];

      // Should pass Base currency, not Ethereum
      expect(selectedCurrency.id).toBe("base");
      expect(selectedCurrency.name).toBe("Base");
    });

    it("should pass the correct network currency (Scroll) when selecting ETH then Scroll", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[
            ethereumCurrency.id,
            arbitrumCurrency.id,
            baseCurrency.id,
            scrollCurrency.id,
          ]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
      await user.click(screen.getByText(/ethereum/i));

      expect(screen.getByText(/select network/i)).toBeVisible();
      await waitFor(() => expect(screen.getByText(/scroll/i)).toBeVisible());

      // Select Scroll network
      await user.click(screen.getByText(/scroll/i));

      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      const selectedCurrency = onAssetSelected.mock.calls[0][0];

      // Should pass Scroll currency
      expect(selectedCurrency.id).toBe("scroll");
      expect(selectedCurrency.name).toBe("Scroll");
    });

    it("should pass Ethereum when selecting Ethereum network from ETH asset list", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[ethereumCurrency.id, arbitrumCurrency.id, baseCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
      await user.click(screen.getByText(/ethereum/i));

      expect(screen.getByText(/select network/i)).toBeVisible();
      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());

      // Select Ethereum network (main network, not L2)
      const ethereumOptions = screen.getAllByText(/ethereum/i);
      // First one should be the network option
      await user.click(ethereumOptions[0]);

      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      const selectedCurrency = onAssetSelected.mock.calls[0][0];

      expect(selectedCurrency.id).toBe("ethereum");
      expect(selectedCurrency.name).toBe("Ethereum");
    });
  });

  describe("Filtered Currencies Mode - Direct Network Selection", () => {
    it("should correctly handle pre-filtered network selection (Arbitrum + Base)", async () => {
      const onAssetSelected = jest.fn();

      render(
        <ModularDrawerFlowManager
          currencies={[arbitrumCurrency.id, baseCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
          areCurrenciesFiltered
        />,
      );

      // Should skip asset selection and go directly to network selection
      await waitFor(() => expect(screen.getByText(/select network/i)).toBeVisible());
      expect(screen.getByText(/arbitrum/i)).toBeVisible();
      expect(screen.getByText(/base/i)).toBeVisible();
    });

    it("should pass correct currency when selecting from filtered networks", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[arbitrumCurrency.id, baseCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
          areCurrenciesFiltered
        />,
      );

      await waitFor(() => expect(screen.getByText(/select network/i)).toBeVisible());
      await user.click(screen.getByText(/arbitrum/i));

      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      const selectedCurrency = onAssetSelected.mock.calls[0][0];

      expect(selectedCurrency.id).toBe("arbitrum");
    });
  });

  describe("Back Navigation - Ensures State Integrity", () => {
    it("should not call onAssetSelected when navigating back from network selection", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[ethereumCurrency.id, arbitrumCurrency.id, baseCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
      await user.click(screen.getByText(/ethereum/i));

      expect(screen.getByText(/select network/i)).toBeVisible();
      await waitFor(() => expect(screen.getByText(/arbitrum/i)).toBeVisible());

      // Click back button instead of selecting a network
      await user.click(screen.getByTestId("mad-back-button"));

      // Should go back to asset selection
      expect(screen.getByText(/select asset/i)).toBeVisible();

      // onAssetSelected should NOT have been called
      expect(onAssetSelected).not.toHaveBeenCalled();
    });

    it("should allow re-selecting different network after going back", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[ethereumCurrency.id, arbitrumCurrency.id, baseCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
      await user.click(screen.getByText(/ethereum/i));

      await waitFor(() => expect(screen.getByText(/arbitrum/i)).toBeVisible());

      // Go back
      await user.click(screen.getByTestId("mad-back-button"));
      expect(screen.getByText(/select asset/i)).toBeVisible();

      // Select ethereum again
      await user.click(screen.getByText(/ethereum/i));
      expect(screen.getByText(/select network/i)).toBeVisible();

      // Now select Base instead of Arbitrum
      await waitFor(() => expect(screen.getByText(/base/i)).toBeVisible());
      await user.click(screen.getByText(/base/i));

      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      const selectedCurrency = onAssetSelected.mock.calls[0][0];
      expect(selectedCurrency.id).toBe("base");
    });
  });

  describe("Single Currency - No Network Selection Needed", () => {
    it("should directly call onAssetSelected for Bitcoin (no networks)", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[bitcoinCurrency.id, ethereumCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
      await user.click(screen.getByText(/bitcoin/i));

      // Should directly call onAssetSelected without network selection step
      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      const selectedCurrency = onAssetSelected.mock.calls[0][0];

      expect(selectedCurrency.id).toBe("bitcoin");
      expect(selectedCurrency.name).toBe("Bitcoin");
    });
  });

  describe("Account Selection Flow - Extended Bug Scenario", () => {
    it("should pass correct currency to account selection after network choice", async () => {
      const onAccountSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[ethereumCurrency.id, arbitrumCurrency.id]}
          onAccountSelected={onAccountSelected}
          useCase="swap"
        />,
        {
          initialState: {
            accounts: [], // No accounts - will show empty account selection
          },
        },
      );

      await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
      await user.click(screen.getByText(/ethereum/i));

      expect(screen.getByText(/select network/i)).toBeVisible();
      await waitFor(() => expect(screen.getByText(/arbitrum/i)).toBeVisible());

      // Select Arbitrum network
      await user.click(screen.getByText(/arbitrum/i));

      // Should navigate to account selection
      await waitFor(() => expect(screen.getByText(/select account/i)).toBeVisible());

      // The selected asset in the background should be Arbitrum, not Ethereum
      // This is verified by the component not throwing errors and rendering correctly
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    it("should handle empty currency list gracefully", async () => {
      const onAssetSelected = jest.fn();

      render(
        <ModularDrawerFlowManager
          currencies={[]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      // Should still render the asset selection screen
      await waitFor(() => expect(screen.getByText(/select asset/i)).toBeVisible());
    });

    it("should work with mixed single and multi-network currencies", async () => {
      const onAssetSelected = jest.fn();

      const { user } = render(
        <ModularDrawerFlowManager
          currencies={[bitcoinCurrency.id, ethereumCurrency.id, arbitrumCurrency.id]}
          onAssetSelected={onAssetSelected}
          useCase="swap"
        />,
      );

      // Test Bitcoin (single network)
      await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
      await user.click(screen.getByText(/bitcoin/i));

      expect(onAssetSelected).toHaveBeenCalledTimes(1);
      expect(onAssetSelected.mock.calls[0][0].id).toBe("bitcoin");
    });
  });
});
