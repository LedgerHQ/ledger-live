import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import {
  arbitrumCurrency,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  scrollCurrency,
} from "../../__mocks__/useSelectAssetFlow.mock";
import {
  currencies,
  mockDomMeasurements,
  mockOnAssetSelected,
  DialogTestWrapper,
} from "../../__tests__/shared";
import ModularDialogFlowManager from "../ModularDialogFlowManager";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

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
describe("ModularDialogFlowManager - Select Network Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render AssetSelection step with correct props", async () => {
    render(
      <DialogTestWrapper>
        <ModularDialogFlowManager
          currencies={mockCurrencies}
          onAssetSelected={mockOnAssetSelected}
        />
      </DialogTestWrapper>,
    );

    expect(screen.getAllByText(/select asset/i)[0]).toBeVisible();
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
  });

  it("should call onAssetSelected when an asset is selected", async () => {
    const { user } = render(
      <DialogTestWrapper>
        <ModularDialogFlowManager
          currencies={mockCurrencies}
          onAssetSelected={mockOnAssetSelected}
        />
      </DialogTestWrapper>,
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    const bitcoinAsset = screen.getByText(/bitcoin/i);
    await user.click(bitcoinAsset);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(bitcoinCurrency);
  });

  it("should navigate to NetworkSelection step after asset selection", async () => {
    const { user } = render(
      <DialogTestWrapper>
        <ModularDialogFlowManager
          currencies={mockCurrencies}
          onAssetSelected={mockOnAssetSelected}
        />
      </DialogTestWrapper>,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should call onAssetSelected after network selection", async () => {
    const { user } = render(
      <DialogTestWrapper>
        <ModularDialogFlowManager
          currencies={mockCurrencies}
          onAssetSelected={mockOnAssetSelected}
        />
      </DialogTestWrapper>,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const arbitrumNetwork = screen.getByText(/arbitrum/i);
    await user.click(arbitrumNetwork);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(arbitrumCurrency);
  });

  // This test is to ensure that we display the provider currency if the currency is not in the sortedCryptoCurrencies then display the network currencies it refers to the setAssetsToDisplay in the useMemo done inside ModularDialogFlowManager.tsx
  it("should display the provider currency if the currency is not in the sortedCryptoCurrencies then display the network currencies", async () => {
    const { user } = render(
      <DialogTestWrapper>
        <ModularDialogFlowManager
          currencies={mixedCurrenciesIds}
          onAssetSelected={mockOnAssetSelected}
        />
      </DialogTestWrapper>,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
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
    const { user } = render(
      <DialogTestWrapper>
        <ModularDialogFlowManager
          currencies={mixedCurrenciesIds}
          onAssetSelected={mockOnAssetSelected}
        />
      </DialogTestWrapper>,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
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
    const { user } = render(
      <DialogTestWrapper>
        <ModularDialogFlowManager
          currencies={mockCurrencies}
          onAssetSelected={mockOnAssetSelected}
        />
      </DialogTestWrapper>,
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    const input = screen.getByRole("textbox");
    await user.type(input, "whatCurrencyAmI");

    await waitFor(() => expect(screen.getByText(/no assets found/i)).toBeVisible());
  });
});
