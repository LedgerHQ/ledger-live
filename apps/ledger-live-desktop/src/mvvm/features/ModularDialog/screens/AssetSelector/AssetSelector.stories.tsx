import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ARB_ACCOUNT, BTC_ACCOUNT, ETH_ACCOUNT } from "../../../__mocks__/accounts.mock";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  mockAssetsConfiguration,
} from "../../../__mocks__/useSelectAssetFlow.mock";
import AssetSelector from ".";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";

const assetsToDisplay = [ethereumCurrency, arbitrumCurrency, bitcoinCurrency];
const onAssetSelected = fn();

const preloadedAssetsDataApiState = {
  queries: {
    mockAssetsQuery: {
      data: {
        pages: [
          {
            markets: {
              ethereum: {
                price: 2500.5,
                priceChangePercentage24h: 5.25,
                marketCap: 300000000000,
                ticker: "ETH",
                name: "Ethereum",
              },
              arbitrum: {
                price: 1.25,
                priceChangePercentage24h: -2.1,
                marketCap: 5000000000,
                ticker: "ARB",
                name: "Arbitrum",
              },
              bitcoin: {
                price: 45000,
                priceChangePercentage24h: 1.8,
                marketCap: 900000000000,
                ticker: "BTC",
                name: "Bitcoin",
              },
            },
            interestRates: {
              ethereum: {
                currencyId: "ethereum",
                rate: 0.045,
                type: "APY",
                fetchAt: "2024-10-13T10:00:00Z",
              },
              arbitrum: {
                currencyId: "arbitrum",
                rate: 0.032,
                type: "APR",
                fetchAt: "2024-10-13T10:00:00Z",
              },
              bitcoin: {
                currencyId: "bitcoin",
                rate: 0.028,
                type: "NRR",
                fetchAt: "2024-10-13T10:00:00Z",
              },
            },
          },
        ],
      },
    },
  },
};

const createMockState = () => ({
  accounts: [ARB_ACCOUNT, ETH_ACCOUNT, BTC_ACCOUNT],
  wallet: {
    accountNames: new Map([
      ["bitcoin1", "bitcoin-account-1"],
      ["ethereum1", "ethereum-account-1"],
      ["arbitrum1", "arbitrum-account-1"],
    ]),
  },
  discreet: false,
  locale: "en-US",
  currency: {
    type: "FiatCurrency",
    ticker: "USD",
    name: "US Dollar",
    symbol: "$",
    units: [
      {
        code: "$",
        name: "US Dollar",
        magnitude: 2,
        showAllDigits: true,
        prefixCode: true,
      },
    ],
  },
  application: { debug: {} },
  modularDrawer: {
    searchedValue: "",
  },
});

const initialMockState = createMockState();

const createStore = (options?: { discreet?: boolean }) =>
  configureStore({
    reducer: {
      accounts: (state = initialMockState.accounts) => state,
      wallet: (state = initialMockState.wallet) => state,
      discreet: () => options?.discreet ?? false,
      locale: (state = initialMockState.locale) => state,
      currency: (state = initialMockState.currency) => state,
      application: (state = initialMockState.application) => state,
      modularDrawer: (state = initialMockState.modularDrawer) => state,
      assetsDataApi: (state = {}) => state,
    },
    preloadedState: { assetsDataApi: preloadedAssetsDataApiState },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });

const defaultStore = createStore();

const meta: Meta<typeof AssetSelector> = {
  title: "ModularDialog/AssetSelection",
  component: AssetSelector,
  args: {
    assetsToDisplay,
    assetsConfiguration: {},
    onAssetSelected: onAssetSelected,
    providersLoadingStatus: LoadingStatus.Success,
  },
  decorators: [
    Story => (
      <Provider store={defaultStore}>
        <div style={{ width: "100%", height: "100%" }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AssetSelector>;

export const Default: Story = {};

export const WithBalanceAndApy: Story = {
  args: {
    assetsConfiguration: {
      ...mockAssetsConfiguration,
    },
  },
};

export const WithDiscreetModeEnabled: Story = {
  args: {
    assetsConfiguration: {
      ...mockAssetsConfiguration,
    },
  },
  decorators: [
    Story => {
      const discreetModeStore = createStore({ discreet: true });

      return (
        <Provider store={discreetModeStore}>
          <div style={{ width: "100%", height: "100%" }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const EmptyAssets: Story = {
  args: {
    assetsToDisplay: [],
  },
};
