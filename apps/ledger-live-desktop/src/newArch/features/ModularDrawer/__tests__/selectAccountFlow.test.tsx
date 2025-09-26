import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import React from "react";
import * as reactRedux from "react-redux";
import { render, screen, waitFor } from "tests/testSetup";
import ModalsLayer from "~/renderer/ModalsLayer";
import { track, trackPage } from "~/renderer/analytics/segment";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import {
  ARB_ACCOUNT,
  BASE_ACCOUNT,
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "../../__mocks__/accounts.mock";
import {
  arbitrumCurrency,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  scrollCurrency,
  usdcToken,
} from "../../__mocks__/useSelectAssetFlow.mock";
import {
  currencies,
  mockDispatch,
  mockDomMeasurements,
  mockOnAccountSelected,
} from "../../__tests__/shared";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: () => mockUseCurrenciesUnderFeatureFlag(),
}));

const mockUseCurrenciesUnderFeatureFlag = jest.fn(() => ({
  deactivatedCurrencyIds: new Set(),
}));

const MAD_BACK_BUTTON_TEST_ID = "mad-back-button";

beforeEach(() => {
  mockDomMeasurements();
});

const mockCurrencies = currencies.map(currency => currency.id);

describe("ModularDrawerFlowManager - Select Account Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render AssetSelection step with correct props", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    expect(screen.getByText(/select asset/i)).toBeVisible();
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
  });

  it("should navigate to NetworkSelection step after asset selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    expect(screen.getByText(/select network/i)).toBeVisible();
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should navigate to AccountSelection step after network selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const arbitrumNetwork = screen.getByText(/ethereum/i);
    await user.click(arbitrumNetwork);

    expect(screen.getByText(/select account/i)).toBeVisible();
    expect(screen.getByText(/add new or existing account/i)).toBeVisible();
    expect(screen.getByText(/ethereum 2/i)).toBeVisible();
    expect(screen.getByText(/1 eth/i)).toBeVisible();
  });

  it("should call onSelectAccount after accountSelection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const ethereumNetwork = screen.getByText(/ethereum/i);
    await user.click(ethereumNetwork);

    const account = screen.getByText(/ethereum 2/i);
    await user.click(account);

    expect(mockOnAccountSelected).toHaveBeenCalledWith(ETH_ACCOUNT);
  });

  it("should navigate directly to accountSelection step", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={[ethereumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum 2/i)).toBeVisible());
  });

  it("should navigate directly to networkSelection step", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={[ethereumCurrency.id, arbitrumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
    );

    await waitFor(() => expect(screen.getByText(/select network/i)).toBeVisible());
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/arbitrum/i)).toBeVisible();
  });

  it("should display empty screen if there is no account", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={[bitcoinCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/select account/i)).toBeVisible());
    expect(screen.getByText(/add new or existing account/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should trigger add account with corresponding currency", async () => {
    const useDispatchSpy = jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);
    const bitcoinCurrencyResult = getCryptoCurrencyById("bitcoin");
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={[bitcoinCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/select account/i)).toBeVisible());
    expect(screen.getByText(/add new or existing account/i)).toBeVisible();
    await user.click(screen.getByText(/add new or existing account/i));
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        data: {
          currency: bitcoinCurrencyResult,
        },
        name: "MODAL_ADD_ACCOUNTS",
      },
      type: "MODAL_OPEN",
    });

    useDispatchSpy.mockRestore();
  });

  it("should go back to AssetSelection step when clicking on back button", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);
    expect(screen.getByText(/select network/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
    const backButton = screen.getByTestId(MAD_BACK_BUTTON_TEST_ID);
    await user.click(backButton);
    expect(screen.getByText(/select asset/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).not.toBeInTheDocument();
  });

  it("should go back to NetworkSelection step when clicking on back button", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);
    const ethereumNetwork = screen.getByText(/ethereum/i);
    await user.click(ethereumNetwork);

    const backButton = screen.getByTestId(MAD_BACK_BUTTON_TEST_ID);
    await user.click(backButton);

    expect(screen.getByText(/select network/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should not display back button on AccountSelection step if only one account", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={[ethereumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/select account/i)).toBeVisible());
    expect(screen.queryByTestId(MAD_BACK_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it("should not display back button on AccountSelection step if only one currency", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={[ethereumCurrency.id, arbitrumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
    );

    await waitFor(() => expect(screen.getByText(/select network/i)).toBeVisible());
    expect(screen.queryByTestId(MAD_BACK_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it("should not re trigger page tracking on asset search", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      { initialState: { modularDrawer: { flow: "flowTest", source: "sourceTest" } } },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const input = screen.getByRole("textbox");
    await user.type(input, "bitcoin");

    await waitFor(
      () => {
        expect(screen.queryByText(/ethereum/i)).not.toBeInTheDocument();
      },
      {
        timeout: 3000,
      },
    );

    expect(track).toHaveBeenLastCalledWith("asset_searched", {
      page: "Asset Selection",
      searched_value: "bitcoin",
      flow: "flowTest",
      source: "sourceTest",
      asset_component_features: {
        apy: false,
        balance: false,
        filter: false,
        market_trend: false,
      },
    });

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    expect(trackPage).toHaveBeenNthCalledWith(
      1,
      "Asset Selection",
      undefined,
      {
        asset_component_features: {
          apy: false,
          balance: false,
          filter: false,
          market_trend: false,
        },
        flow: "flowTest",
        source: "sourceTest",
      },
      true,
      true,
    );
  });

  it("should navigate normaly doing a complex flow", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    await user.type(screen.getByRole("textbox"), "ethereum");

    await waitFor(() => {
      expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
    });

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    await user.click(screen.getByText(/ethereum/i));
    expect(screen.getByText(/select network/i)).toBeVisible();

    await user.click(screen.getByText(/arbitrum/i));
    expect(screen.getByText(/select account/i)).toBeVisible();

    await user.click(screen.getByTestId(MAD_BACK_BUTTON_TEST_ID));

    expect(screen.getByText(/select network/i)).toBeVisible();

    await user.click(screen.getByTestId(MAD_BACK_BUTTON_TEST_ID));

    expect(screen.getByRole("textbox")).toHaveValue("ethereum");

    await user.clear(screen.getByRole("textbox"));

    await waitFor(() => {
      expect(screen.getByText(/bitcoin/i)).toBeVisible();
    });

    await user.click(screen.getByText(/bitcoin/i));
    expect(screen.getByText(/select account/i)).toBeVisible();
  });

  it("should navigate to usdc account selection step", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={[usdcToken.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT_WITH_USDC],
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/usdc/i)).toBeVisible());
    await user.click(screen.getByText(/usdc/i));
    expect(screen.getByText(/select account/i)).toBeVisible();
  });

  it("should navigate to bitcoin account selection step", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={[baseCurrency.id, scrollCurrency.id, bitcoinCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [BASE_ACCOUNT, ARB_ACCOUNT, BTC_ACCOUNT],
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    await user.click(screen.getByText(/bitcoin/i));
    expect(screen.getByText(/select account/i)).toBeVisible();
    expect(screen.getByText(/bitcoin 2/i)).toBeVisible();
  });

  it("should keep the MAD opened during add account flow", async () => {
    const { user } = render(
      <>
        <div id="modals" />
        <ModularDrawerFlowManager
          currencies={[baseCurrency.id, scrollCurrency.id, bitcoinCurrency.id]}
          onAccountSelected={mockOnAccountSelected}
          areCurrenciesFiltered
        />
        <ModalsLayer />
      </>,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [BASE_ACCOUNT, ARB_ACCOUNT, BTC_ACCOUNT],
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    await user.click(screen.getByText(/bitcoin/i));
    expect(screen.getByText(/select account/i)).toBeVisible();

    await user.click(screen.getByText(/add new or existing account/i));
    expect(screen.getByText(/bitcoin 2/i)).toBeVisible();
    expect(screen.getByText(/add accounts/i)).toBeVisible();
  });

  it("should auto focus on search input when autoFocus is true", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
    );

    await waitFor(() => expect(screen.getByRole("textbox")).toBeVisible());
    expect(screen.getByRole("textbox")).toHaveFocus();
  });
});
