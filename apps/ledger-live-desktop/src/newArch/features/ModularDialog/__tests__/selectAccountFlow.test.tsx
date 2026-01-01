import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import React from "react";
import * as reduxHooks from "LLD/hooks/redux";
import { render, screen, waitFor } from "tests/testSetup";
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
import ModularDialogFlowManager from "../ModularDialogFlowManager";

const actualUseDispatch = jest.requireActual<typeof reduxHooks>("LLD/hooks/redux").useDispatch;
jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual<typeof reduxHooks>("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: jest.fn(() => actual.useDispatch()),
  };
});

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

// Helper to get the back button from DialogHeader (uses aria-label since DialogHeader doesn't expose test-id)
const getBackButton = () => {
  return screen.getByLabelText("components.dialogHeader.goBackAriaLabel");
};

beforeEach(() => {
  mockDomMeasurements();
});

const mockCurrencies = currencies.map(currency => currency.id);

describe("ModularDialogFlowManager - Select Account Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render AssetSelection step with correct props", async () => {
    render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    expect(screen.getAllByText(/select asset/i)[0]).toBeVisible();
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
  });

  it("should navigate to NetworkSelection step after asset selection", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();
    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should navigate to AccountSelection step after network selection", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const arbitrumNetwork = screen.getByText(/ethereum/i);
    await user.click(arbitrumNetwork);

    expect(screen.getAllByText(/select account/i)[0]).toBeVisible();
    expect(screen.getByText(/add account/i)).toBeVisible();
    expect(screen.getByText(/ethereum 2/i)).toBeVisible();
    expect(screen.getByText(/1 eth/i)).toBeVisible();
  });

  it("should call onSelectAccount after accountSelection", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,

      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
          modularDrawer: { isOpen: true },
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
      <ModularDialogFlowManager
        currencies={[ethereumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum 2/i)).toBeVisible());
  });

  it("should navigate directly to networkSelection step", async () => {
    render(
      <ModularDialogFlowManager
        currencies={[ethereumCurrency.id, arbitrumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getAllByText(/select network/i)[0]).toBeVisible());
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/arbitrum/i)).toBeVisible();
  });

  it("should display empty screen if there is no account", async () => {
    render(
      <ModularDialogFlowManager
        currencies={[bitcoinCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getAllByText(/select account/i)[0]).toBeVisible());
    expect(screen.getByText(/add account/i)).toBeVisible();
    expect(screen.getAllByText(/you don't have bitcoin accounts yet/i)[0]).toBeVisible();
  });

  it("should trigger add account with corresponding currency", async () => {
    const useDispatchMock = jest.mocked(reduxHooks.useDispatch);
    useDispatchMock.mockReturnValue(mockDispatch);
    const bitcoinCurrencyResult = getCryptoCurrencyById("bitcoin");
    const { user } = render(
      <ModularDialogFlowManager
        currencies={[bitcoinCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getAllByText(/select account/i)[0]).toBeVisible());
    expect(screen.getByText(/add account/i)).toBeVisible();
    await user.click(screen.getByText(/add account/i));
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        data: {
          currency: bitcoinCurrencyResult,
        },
        name: "MODAL_ADD_ACCOUNTS",
      },
      type: "MODAL_OPEN",
    });

    useDispatchMock.mockImplementation(actualUseDispatch);
  });

  it("should go back to AssetSelection step when clicking on back button", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);
    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
    const backButton = getBackButton();
    await user.click(backButton);
    expect(screen.getAllByText(/select asset/i)[0]).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).not.toBeInTheDocument();
  });

  it("should go back to NetworkSelection step when clicking on back button", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);
    const ethereumNetwork = screen.getByText(/ethereum/i);
    await user.click(ethereumNetwork);

    const backButton = getBackButton();
    await user.click(backButton);

    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should not display back button on AccountSelection step if only one account", async () => {
    render(
      <ModularDialogFlowManager
        currencies={[ethereumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getAllByText(/select account/i)[0]).toBeVisible());
    expect(screen.queryByLabelText("components.sheetBar.goBackAriaLabel")).not.toBeInTheDocument();
  });

  it("should not display back button on AccountSelection step if only one currency", async () => {
    render(
      <ModularDialogFlowManager
        currencies={[ethereumCurrency.id, arbitrumCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getAllByText(/select network/i)[0]).toBeVisible());
    expect(screen.queryByLabelText("components.sheetBar.goBackAriaLabel")).not.toBeInTheDocument();
  });

  it("should not re trigger page tracking on asset search", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        initialState: {
          modularDrawer: { flow: "flowTest", source: "sourceTest", isOpen: true },
        },
      },
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
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "ethereum");

    await waitFor(
      () => {
        expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    await user.click(screen.getByText(/ethereum/i));
    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();

    await user.click(screen.getByText(/arbitrum/i));
    expect(screen.getAllByText(/select account/i)[0]).toBeVisible();

    await user.click(getBackButton());

    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();

    await user.click(getBackButton());

    expect(screen.getByRole("textbox")).toHaveValue("ethereum");

    await user.clear(screen.getByRole("textbox"));

    await waitFor(() => {
      expect(screen.getByText(/bitcoin/i)).toBeVisible();
    });

    await user.click(screen.getByText(/bitcoin/i));
    expect(screen.getAllByText(/select account/i)[0]).toBeVisible();
  });

  it("should navigate to usdc account selection step", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={[usdcToken.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT_WITH_USDC],
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/usdc/i)).toBeVisible());
    await user.click(screen.getByText(/usdc/i));
    expect(screen.getAllByText(/select account/i)[0]).toBeVisible();
  });

  it("should navigate to bitcoin account selection step", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={[baseCurrency.id, scrollCurrency.id, bitcoinCurrency.id]}
        onAccountSelected={mockOnAccountSelected}
        areCurrenciesFiltered
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [BASE_ACCOUNT, ARB_ACCOUNT, BTC_ACCOUNT],
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    await user.click(screen.getByText(/bitcoin/i));
    expect(screen.getAllByText(/select account/i)[0]).toBeVisible();
    expect(screen.getByText(/bitcoin 2/i)).toBeVisible();
  });

  it("should auto focus on search input when autoFocus is true", async () => {
    render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByRole("textbox")).toBeVisible());
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
  });

  it("should display description when there are no accounts for the selected network", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [],
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const ethereumNetwork = screen.getByText(/ethereum/i);
    await user.click(ethereumNetwork);

    await waitFor(() => expect(screen.getAllByText(/select account/i)[0]).toBeVisible());

    const descriptions = screen.getAllByText(/you don't have ethereum accounts yet/i);
    expect(descriptions[0]).toBeVisible();
  });

  it("should NOT display description when there are accounts for the selected network", async () => {
    const { user } = render(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAccountSelected={mockOnAccountSelected}
      />,
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: [ETH_ACCOUNT],
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const ethereumNetwork = screen.getByText(/ethereum/i);
    await user.click(ethereumNetwork);

    await waitFor(() => expect(screen.getAllByText(/select account/i)[0]).toBeVisible());

    const description = screen.queryByText(/you don't have ethereum accounts yet/i);
    expect(description).not.toBeInTheDocument();
  });
});
