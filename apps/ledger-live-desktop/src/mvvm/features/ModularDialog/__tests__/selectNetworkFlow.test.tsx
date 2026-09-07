import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import {
  arbitrumCurrency,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  scrollCurrency,
} from "../../__mocks__/useSelectAssetFlow.mock";
import { currencies, mockDomMeasurements, mockOnAssetSelected } from "../../__tests__/shared";
import ModularDialogFlowManager from "../ModularDialogFlowManager";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

type CurrencyPredicate = (currency: CryptoOrTokenCurrency) => boolean;

const acceptAllCurrencies: CurrencyPredicate = () => true;
const mockUseAcceptedCurrency = jest.fn((): CurrencyPredicate => acceptAllCurrencies);

beforeEach(() => {
  mockDomMeasurements();
  mockUseAcceptedCurrency.mockImplementation(() => acceptAllCurrencies);
});

const dialogParamsMockCurrencies = {
  isOpen: true,
  dialogParams: {
    currencies: currencies.map(currency => currency.id),
    onAssetSelected: mockOnAssetSelected,
  },
};

const mixedCurrencies = [
  baseCurrency,
  arbitrumCurrency,
  scrollCurrency,
  bitcoinCurrency,
  ethereumCurrency,
];

const dialogParamsMixedCurrencies = {
  isOpen: true,
  dialogParams: {
    currencies: mixedCurrencies.map(currency => currency.id),
    onAssetSelected: mockOnAssetSelected,
  },
};

const dialogParamsWithSelectableNetworks = {
  isOpen: true,
  dialogParams: {
    selectableNetworkIds: [ethereumCurrency.id],
    onAssetSelected: mockOnAssetSelected,
  },
};

const waitForSkeletonToBeRemoved = async () => {
  // Wait for the asset list to be rendered (skeletons are replaced with actual content)
  await waitFor(() => {
    expect(screen.getByTestId("asset-selector-list-container")).toBeInTheDocument();
  });
};

describe("ModularDialogFlowManager - Select Network Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render AssetSelection step with correct props", async () => {
    render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsMockCurrencies },
    });

    expect(screen.getAllByText(/select asset/i)[0]).toBeVisible();

    await waitForSkeletonToBeRemoved();

    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
  });

  it("should call onAssetSelected when an asset is selected", async () => {
    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsMockCurrencies },
    });

    await waitForSkeletonToBeRemoved();

    const bitcoinAsset = screen.getByText(/bitcoin/i);
    await user.click(bitcoinAsset);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(bitcoinCurrency);
  });

  it("should render ineligible assets as disabled and prevent their selection", async () => {
    // Narrow the catalog so the ineligible group stays within the virtualized window.
    const displayedIds = new Set<string>([ethereumCurrency.id, bitcoinCurrency.id]);
    mockUseAcceptedCurrency.mockImplementation(() => currency => displayedIds.has(currency.id));

    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsWithSelectableNetworks },
    });

    await waitForSkeletonToBeRemoved();

    expect(screen.getByTestId("asset-selector-unavailable-assets-header")).toBeInTheDocument();

    const bitcoinAsset = screen.getByTestId("asset-item-ticker-btc");
    expect(bitcoinAsset).toHaveAttribute("aria-disabled", "true");

    await user.click(bitcoinAsset);

    expect(mockOnAssetSelected).not.toHaveBeenCalled();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Bitcoin isn't supported yet.");

    bitcoinAsset.parentElement?.focus();

    expect(bitcoinAsset.parentElement).toHaveFocus();
    expect(bitcoinAsset.parentElement).toHaveAttribute("role", "button");
    expect(bitcoinAsset.parentElement).toHaveAttribute("aria-disabled", "true");
  });

  it("should allow eligible assets to reach the full network list", async () => {
    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsWithSelectableNetworks },
    });

    await waitForSkeletonToBeRemoved();

    const ethereumAsset = screen.getByTestId("asset-item-ticker-eth");
    expect(ethereumAsset).not.toHaveAttribute("aria-disabled", "true");

    await user.click(ethereumAsset);

    const ethereumNetwork = screen.getByTestId("network-item-name-Ethereum");
    const arbitrumNetwork = screen.getByTestId("network-item-name-Arbitrum");
    expect(arbitrumNetwork).toHaveAttribute("aria-disabled", "true");

    await user.click(arbitrumNetwork);

    expect(mockOnAssetSelected).not.toHaveBeenCalled();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Arbitrum network isn't supported yet.",
    );

    arbitrumNetwork.parentElement?.focus();

    expect(arbitrumNetwork.parentElement).toHaveFocus();
    expect(arbitrumNetwork.parentElement).toHaveAttribute("role", "button");
    expect(arbitrumNetwork.parentElement).toHaveAttribute("aria-disabled", "true");

    await user.click(ethereumNetwork);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(ethereumCurrency);
  });

  it("should navigate to NetworkSelection step after asset selection", async () => {
    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsMockCurrencies },
    });

    await waitForSkeletonToBeRemoved();

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should call onAssetSelected after network selection", async () => {
    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsMockCurrencies },
    });

    await waitForSkeletonToBeRemoved();

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const arbitrumNetwork = screen.getByText(/arbitrum/i);
    await user.click(arbitrumNetwork);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(arbitrumCurrency);
  });

  // This test is to ensure that we display the provider currency if the currency is not in the sortedCryptoCurrencies then display the network currencies it refers to the setAssetsToDisplay in the useMemo done inside ModularDialogFlowManager.tsx
  it("should display the provider currency if the currency is not in the sortedCryptoCurrencies then display the network currencies", async () => {
    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsMixedCurrencies },
    });

    await waitForSkeletonToBeRemoved();

    expect(screen.queryByText(/scroll/i)).toBeNull();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();

    await user.click(screen.getByText(/ethereum/i));

    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();

    expect(screen.queryByText(/ethereum/i)).not.toBeNull();
    expect(screen.queryByText(/bitcoin/i)).toBeNull();

    expect(screen.getByText(/arbitrum/i)).toBeVisible();
    expect(screen.getByText(/base/i)).toBeVisible();
    expect(screen.getByText(/scroll/i)).toBeVisible();
  });

  it("should handle the search in the assetsSelection screen when I have no provider currencies but only provided currencies", async () => {
    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsMixedCurrencies },
    });

    await waitForSkeletonToBeRemoved();

    expect(screen.queryByText(/scroll/i)).toBeNull();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();

    const input = screen.getByRole("textbox");
    await user.type(input, "ethereum");

    await waitFor(
      () => {
        expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());

    await user.clear(screen.getByRole("textbox"));

    await waitFor(() => {
      expect(screen.queryByText(/bitcoin/i)).toBeVisible();
    });
    expect(screen.getByText(/ethereum/i)).toBeVisible();
  });

  it("should display the empty state when there are no assets", async () => {
    const { user } = render(<ModularDialogFlowManager />, {
      initialState: { modularDialog: dialogParamsMockCurrencies },
    });

    await waitForSkeletonToBeRemoved();

    const input = screen.getByRole("textbox");
    await user.type(input, "whatCurrencyAmI");

    await waitFor(() => expect(screen.getByText(/no assets found/i)).toBeVisible());
  });
});
