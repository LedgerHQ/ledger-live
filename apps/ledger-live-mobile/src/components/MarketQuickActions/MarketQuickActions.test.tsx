import React from "react";
import { renderWithReactQuery } from "@tests/test-renderer";
import { MarketQuickActions } from "./";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { ScreenName } from "~/const";
import { createStackNavigator } from "@react-navigation/stack";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { State } from "~/reducers/types";
import { isCurrencySupported } from "@ledgerhq/coin-framework/currencies/support";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

const Stack = createStackNavigator();

const moneroCurrency = getCryptoCurrencyById("monero");
const kaspaCurrency = getCryptoCurrencyById("kaspa");
const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const ethereumCurrency = getCryptoCurrencyById("ethereum");

export const usdcCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: ethereumCurrency,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  ],
};

const bitcoinAccount = genAccount("bitcoin-account", { currency: bitcoinCurrency });
const kaspaAccount = genAccount("kaspa-account", { currency: kaspaCurrency });
const ethereumAccount = genAccount("ethereum-account", { currency: ethereumCurrency });

// Mock the support module
jest.mock("@ledgerhq/coin-framework/currencies/support");

// Set up the mock implementation
(isCurrencySupported as jest.Mock).mockImplementation(currency => {
  const supportedIds = new Set(["ethereum", "kaspa", "bitcoin"]);
  return supportedIds.has(currency.id);
});

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: jest.fn(() => ({
    isCurrencyAvailable: jest.fn(currencyId => currencyId === bitcoinCurrency.id),
  })),
}));

const TestNavigator = ({ children }: { children: React.ReactNode }) => (
  <Stack.Navigator initialRouteName={ScreenName.MarketDetail}>
    <Stack.Screen name={ScreenName.MarketDetail}>{() => children}</Stack.Screen>
  </Stack.Navigator>
);

describe("MarketQuickActions", () => {
  it("should render all quick actions for fully supported currencies", () => {
    const { getByText } = renderWithReactQuery(
      <TestNavigator>
        <MarketQuickActions currency={bitcoinCurrency} accounts={[bitcoinAccount]} />
      </TestNavigator>,
    );
    expect(getByText(/buy/i)).toBeVisible();
    expect(getByText(/swap/i)).toBeVisible();
    expect(getByText(/sell/i)).toBeVisible();
    expect(getByText(/send/i)).toBeVisible();
    expect(getByText(/receive/i)).toBeVisible();
  });

  it("should not render quick actions for not supported currencies", () => {
    const { queryByText } = renderWithReactQuery(
      <TestNavigator>
        <MarketQuickActions currency={moneroCurrency} accounts={[kaspaAccount]} />
      </TestNavigator>,
    );
    expect(queryByText(/buy/i)).toBeNull();
    expect(queryByText(/swap/i)).toBeNull();
    expect(queryByText(/sell/i)).toBeNull();
    expect(queryByText(/send/i)).toBeNull();
    expect(queryByText(/receive/i)).toBeNull();
  });

  it("should not render quick actions for currencies under feature flag #false FF", () => {
    const { queryByText } = renderWithReactQuery(
      <TestNavigator>
        <MarketQuickActions currency={kaspaCurrency} accounts={[kaspaAccount]} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [kaspaAccount],
          },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              currencyKaspa: {
                enabled: false,
              },
            },
          },
        }),
      },
    );
    expect(queryByText(/buy/i)).toBeNull();
    expect(queryByText(/swap/i)).toBeNull();
    expect(queryByText(/sell/i)).toBeNull();
    expect(queryByText(/send/i)).toBeNull();
    expect(queryByText(/receive/i)).toBeNull();
  });

  it("should render quick actions for currencies under feature flag #true FF", () => {
    const { queryByText, getByText } = renderWithReactQuery(
      <TestNavigator>
        <MarketQuickActions currency={kaspaCurrency} accounts={[kaspaAccount]} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [kaspaAccount],
          },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              currencyKaspa: { enabled: true },
            },
          },
        }),
      },
    );
    expect(queryByText(/buy/i)).toBeNull();
    expect(getByText(/swap/i)).toBeVisible();
    expect(queryByText(/sell/i)).toBeNull();
    expect(getByText(/send/i)).toBeVisible();
    expect(getByText(/receive/i)).toBeVisible();
  });

  it("should not render quick actions for currencies under feature flag even with an account #false FF", () => {
    const { queryByText } = renderWithReactQuery(
      <TestNavigator>
        <MarketQuickActions currency={kaspaCurrency} accounts={[kaspaAccount]} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [kaspaAccount],
          },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              currencyKaspa: { enabled: false },
            },
          },
        }),
      },
    );
    expect(queryByText(/buy/i)).toBeNull();
    expect(queryByText(/swap/i)).toBeNull();
    expect(queryByText(/sell/i)).toBeNull();
    expect(queryByText(/send/i)).toBeNull();
    expect(queryByText(/receive/i)).toBeNull();
  });

  it("should render quick actions for currencies under feature flag even with an account #true FF", () => {
    const { getByText, queryByText } = renderWithReactQuery(
      <TestNavigator>
        <MarketQuickActions currency={kaspaCurrency} accounts={[kaspaAccount]} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              currencyKaspa: { enabled: true },
            },
          },
        }),
      },
    );
    expect(queryByText(/buy/i)).toBeNull();
    expect(getByText(/swap/i)).toBeVisible();
    expect(queryByText(/sell/i)).toBeNull();
    expect(getByText(/send/i)).toBeVisible();
    expect(getByText(/receive/i)).toBeVisible();
  });

  it("should render quick actions for token currencies", () => {
    const { getByText, queryByText } = renderWithReactQuery(
      <TestNavigator>
        <MarketQuickActions currency={usdcCurrency} accounts={[ethereumAccount]} />
      </TestNavigator>,
    );
    expect(queryByText(/buy/i)).toBeNull();
    expect(getByText(/swap/i)).toBeVisible();
    expect(queryByText(/sell/i)).toBeNull();
    expect(getByText(/send/i)).toBeVisible();
    expect(getByText(/receive/i)).toBeVisible();
  });
});
