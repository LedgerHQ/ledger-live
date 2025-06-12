import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import {
  ethereumCurrency,
  bitcoinCurrency,
  arbitrumCurrency,
} from "../__mocks__/useSelectAssetFlow.mock";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { Mocked_ETH_Account } from "../__mocks__/accounts.mock";
import { mockOnAccountSelected, mockDispatch, currencies, mockDomMeasurements } from "./shared";
import * as reactRedux from "react-redux";
import { track, trackPage } from "~/renderer/analytics/segment";

jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

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
          accounts: Mocked_ETH_Account,
        },
      },
    );

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const arbitrumNetwork = screen.getByText(/ethereum/i);
    await user.click(arbitrumNetwork);

    expect(screen.getByText(/select account/i)).toBeVisible();
    expect(screen.getByText(/add new or existing account/i)).toBeVisible();
    expect(screen.getByText(/ethereum 3/i)).toBeVisible();
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
          accounts: Mocked_ETH_Account,
        },
      },
    );

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const ethereumNetwork = screen.getByText(/ethereum/i);
    await user.click(ethereumNetwork);

    const account = screen.getByText(/ethereum 3/i);
    await user.click(account);

    expect(mockOnAccountSelected).toHaveBeenCalledWith(Mocked_ETH_Account[0], undefined);
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
          accounts: Mocked_ETH_Account,
        },
      },
    );

    expect(screen.getByText(/ethereum 3/i));
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
          currency: bitcoinCurrency,
        },
        name: "MODAL_ADD_ACCOUNTS",
      },
      type: "MODAL_OPEN",
    });
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
          accounts: Mocked_ETH_Account,
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
});
