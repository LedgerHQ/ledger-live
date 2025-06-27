import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import {
  ethereumCurrency,
  bitcoinCurrency,
  arbitrumCurrency,
  usdcToken,
  baseCurrency,
  scrollCurrency,
} from "../__mocks__/useSelectAssetFlow.mock";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import {
  ARB_ACCOUNT,
  BASE_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "../__mocks__/accounts.mock";
import { mockOnAccountSelected, mockDispatch, currencies, mockDomMeasurements } from "./shared";
import * as reactRedux from "react-redux";
import { track, trackPage } from "~/renderer/analytics/segment";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import ModalsLayer from "~/renderer/ModalsLayer";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

// Mock fetch to prevent actual network requests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(""),
});

const MAD_BACK_BUTTON_TEST_ID = "mad-back-button";

beforeEach(() => {
  mockDomMeasurements();
});

describe("ModularDrawerFlowManager - Select Account Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render AssetSelection step with correct props", () => {
    render(
      <ModularDrawerFlowManager
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    expect(screen.getByText(/select asset/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
  });

  it("should navigate to NetworkSelection step after asset selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    expect(screen.getByText(/select network/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should navigate to AccountSelection step after network selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

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
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const ethereumNetwork = screen.getByText(/ethereum/i);
    await user.click(ethereumNetwork);

    const account = screen.getByText(/ethereum 2/i);
    await user.click(account);

    expect(mockOnAccountSelected).toHaveBeenCalledWith(ETH_ACCOUNT, undefined);
  });

  it("should navigate directly to accountSelection step", () => {
    render(
      <ModularDrawerFlowManager
        currencies={[ethereumCurrency]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

    expect(screen.getByText(/ethereum 2/i));
  });

  it("should navigate directly to networkSelection step", () => {
    render(
      <ModularDrawerFlowManager
        currencies={[ethereumCurrency, arbitrumCurrency]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    expect(screen.getByText(/select network/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/arbitrum/i)).toBeVisible();
  });

  it("should display empty screen if there is no account", () => {
    render(
      <ModularDrawerFlowManager
        currencies={[bitcoinCurrency]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    expect(screen.getByText(/select account/i)).toBeVisible();
    expect(screen.getByText(/add new or existing account/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should trigger add account with corresponding currency", async () => {
    const useDispatchSpy = jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);
    const bitcoinCurrencyResult = getCryptoCurrencyById("bitcoin");
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={[bitcoinCurrency]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    expect(screen.getByText(/select account/i)).toBeVisible();
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
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

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
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
        },
      },
    );

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
        currencies={[ethereumCurrency]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    expect(screen.getByText(/select account/i)).toBeVisible();
    expect(screen.queryByTestId(MAD_BACK_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it("should not display back button on AccountSelection step if only one currency", async () => {
    render(
      <ModularDrawerFlowManager
        currencies={[ethereumCurrency, arbitrumCurrency]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    expect(screen.getByText(/select network/i)).toBeVisible();
    expect(screen.queryByTestId(MAD_BACK_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it("should not re trigger page tracking on asset search", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "bitcoin");

    await waitFor(() => {
      expect(screen.queryByText(/ethereum/i)).not.toBeInTheDocument();
    });

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

    expect(screen.getByText(/bitcoin/i)).toBeVisible();

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
        currencies={currencies}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
    );

    await user.type(screen.getByRole("textbox"), "ethereum");

    await waitFor(() => {
      expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
    });

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
        currencies={[usdcToken]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT_WITH_USDC],
        },
      },
    );

    await user.click(screen.getByText(/usdc/i));
    expect(screen.getByText(/select account/i)).toBeVisible();
  });

  it("should navigate to base account selection step", async () => {
    const { user } = render(
      <ModularDrawerFlowManager
        currencies={[baseCurrency, scrollCurrency, bitcoinCurrency]}
        onAccountSelected={mockOnAccountSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [BASE_ACCOUNT, ARB_ACCOUNT],
        },
      },
    );

    await user.click(screen.getByText(/ethereum/i));
    expect(screen.getByText(/select network/i)).toBeVisible();

    await user.click(screen.getByText(/base/i));
    expect(screen.getByText(/select account/i)).toBeVisible();

    expect(screen.getByText(/base 2/i)).toBeVisible();
  });

  it("should keep the MAD opened during add account flow", async () => {
    const { user } = render(
      <>
        <div id="modals" />
        <ModularDrawerFlowManager
          currencies={[baseCurrency, scrollCurrency, bitcoinCurrency]}
          onAccountSelected={mockOnAccountSelected}
          source="sourceTest"
          flow="flowTest"
        />
        <ModalsLayer />
      </>,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [BASE_ACCOUNT, ARB_ACCOUNT],
        },
      },
    );

    await user.click(screen.getByText(/ethereum/i));
    expect(screen.getByText(/select network/i)).toBeVisible();

    await user.click(screen.getByText(/base/i));
    expect(screen.getByText(/select account/i)).toBeVisible();

    await user.click(screen.getByText(/add new or existing account/i));
    expect(screen.getByText(/base 2/i)).toBeVisible();
    expect(screen.getByText(/add accounts/i)).toBeVisible();
  });
});
