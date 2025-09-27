import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/modularDrawer/__mocks__/useGroupedCurrenciesByProvider.mock";
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
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: () => mockUseCurrenciesUnderFeatureFlag(),
}));

const mockUseCurrenciesUnderFeatureFlag = jest.fn(() => ({
  deactivatedCurrencyIds: new Set(),
}));

beforeEach(() => {
  mockDomMeasurements();
});

const mockCurrencies = currencies.map(currency => currency.id);

const mixedCurrencies = [
  baseCurrency,
  arbitrumCurrency,
  scrollCurrency,
  bitcoinCurrency,
  ethereumCurrency,
];
const mixedCurrenciesIds = mixedCurrencies.map(currency => currency.id);
describe("ModularDrawerFlowManager - Select Network Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render AssetSelection step with correct props", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
      />,
    );

    expect(screen.getByText(/select asset/i)).toBeVisible();
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
  });

  it("should call onAssetSelected when an asset is selected", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    const bitcoinAsset = screen.getByText(/bitcoin/i);
    await user.click(bitcoinAsset);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(bitcoinCurrency);
  });

  it("should navigate to NetworkSelection step after asset selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    expect(screen.getByText(/select network/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should call onAssetSelected after network selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const arbitrumNetwork = screen.getByText(/arbitrum/i);
    await user.click(arbitrumNetwork);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(arbitrumCurrency);
  });

  // This test is to ensure that we display the provider currency if the currency is not in the sortedCryptoCurrencies then display the network currencies it refers to the setAssetsToDisplay in the useMemo done inside ModularDrawerFlowManager.tsx
  it("should display the provider currency if the currency is not in the sortedCryptoCurrencies then display the network currencies", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mixedCurrenciesIds}
        onAssetSelected={mockOnAssetSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.queryByText(/scroll/i)).toBeNull();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();

    await user.click(screen.getByText(/ethereum/i));

    expect(screen.getByText(/select network/i)).toBeVisible();

    expect(screen.queryByText(/ethereum/i)).not.toBeNull();
    expect(screen.queryByText(/bitcoin/i)).toBeNull();

    expect(screen.getByText(/arbitrum/i)).toBeVisible();
    expect(screen.getByText(/base/i)).toBeVisible();
    expect(screen.getByText(/scroll/i)).toBeVisible();
  });

  it("should handle the search in the assetsSelection screen when I have no provider currencies but only provided currencies", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mixedCurrenciesIds}
        onAssetSelected={mockOnAssetSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.queryByText(/scroll/i)).toBeNull();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();

    const input = screen.getByRole("textbox");
    await user.type(input, "ethereum");

    await waitFor(() => {
      expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
    });
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());

    await user.clear(screen.getByRole("textbox"));

    await waitFor(() => {
      expect(screen.queryByText(/bitcoin/i)).toBeVisible();
    });
    expect(screen.getByText(/ethereum/i)).toBeVisible();
  });

  it("should display the empty state when there are no assets", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    const input = screen.getByRole("textbox");
    await user.type(input, "whatCurrencyAmI");

    await waitFor(() => expect(screen.getByText(/no assets found/i)).toBeVisible());
  });
});
