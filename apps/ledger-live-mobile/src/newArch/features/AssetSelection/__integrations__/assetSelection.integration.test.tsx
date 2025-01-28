import React from "react";
import { render, screen } from "@tests/test-renderer";
import AssetSelectionNavigator from "../Navigator";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import {
  mockGroupedCurrenciesBySingleProviderData,
  mockGroupedCurrenciesWithMultipleProviderData,
} from "./mockData";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";

const MockUseRoute = useRoute as jest.Mock;
const MockUseGroupedCurrenciesByProvider = useGroupedCurrenciesByProvider as jest.Mock;
const mockNavigate = jest.fn();

(useNavigation as jest.Mock).mockReturnValue({
  navigate: mockNavigate,
});

jest.mock("../components/NetworkBanner", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="network-banner">Mock Network Banner</div>,
  };
});

jest.mock("@ledgerhq/live-common/deposit/index", () => ({
  useGroupedCurrenciesByProvider: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.useFakeTimers();

describe("Asset Selection test suite", () => {
  it("should render crypto selection screen when no currency is defined in the navigation route showing a loader", () => {
    MockUseRoute.mockReturnValue({
      params: {
        context: AddAccountContexts.AddAccounts,
      },
    });

    MockUseGroupedCurrenciesByProvider.mockReturnValue({
      result: { currenciesByProvider: [], sortedCryptoCurrencies: [] },
      loadingStatus: "pending",
    });

    render(<AssetSelectionNavigator />);

    const screenTitle = screen.getByText(/select asset/i);
    const selectCryptoViewArea = screen.getByTestId("select-crypto-view-area");
    const loader = screen.getByTestId("loader");
    expect(screenTitle).toBeVisible();
    expect(screenTitle).toHaveProp("testID", "select-crypto-header-step1-title");
    expect(selectCryptoViewArea).toBeVisible();
    expect(loader).toBeVisible();
  });

  it("should render crypto selection screen with empty list when useGroupedCurrenciesByProvider finish loading with empty result", () => {
    MockUseRoute.mockReturnValue({
      params: {
        context: AddAccountContexts.AddAccounts,
      },
    });

    MockUseGroupedCurrenciesByProvider.mockReturnValue({
      result: { currenciesByProvider: [], sortedCryptoCurrencies: [] },
      loadingStatus: "success",
    });

    render(<AssetSelectionNavigator />);

    const emptyList = screen.getByText(/no crypto assets found/i);
    expect(emptyList).toBeVisible();
  });
  it("should display a list of cryptocurrencies when useGroupedCurrenciesByProvider successfully loads data", () => {
    MockUseRoute.mockReturnValue({
      params: {
        context: AddAccountContexts.AddAccounts,
      },
    });

    MockUseGroupedCurrenciesByProvider.mockReturnValue({
      result: mockGroupedCurrenciesBySingleProviderData,
      loadingStatus: "success",
    });

    render(<AssetSelectionNavigator />);

    const selectCryptoViewArea = screen.getByTestId("select-crypto-view-area");
    const cryptoCurrencyRow = screen.getByText(/bitcoin/i);
    expect(selectCryptoViewArea).toBeVisible();
    expect(cryptoCurrencyRow).toBeVisible();
  });
  it("should navigate to network selection when currency has more than one network provider", () => {
    MockUseRoute.mockReturnValue({
      params: {
        context: AddAccountContexts.AddAccounts,
        currency: "ethereum",
      },
    });

    MockUseGroupedCurrenciesByProvider.mockReturnValue({
      result: mockGroupedCurrenciesWithMultipleProviderData,
      loadingStatus: "success",
    });

    render(<AssetSelectionNavigator />);

    const selectNetwork = screen.getByTestId("select-network-view-area");
    const title = screen.getByText(/Select the blockchain network the asset belongs to/i);
    const arbitrum = screen.getByText(/arbitrum/i);
    const blast = screen.getByText(/blast/i);
    const boba = screen.getByText(/boba/i);
    expect(selectNetwork).toBeVisible();
    expect(title).toBeVisible();
    [arbitrum, blast, boba].forEach(network => {
      expect(network).toBeVisible();
    });
  });
});
