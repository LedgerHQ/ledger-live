import React from "react";
import { render, screen } from "tests/testSetup";
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

jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

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
});
