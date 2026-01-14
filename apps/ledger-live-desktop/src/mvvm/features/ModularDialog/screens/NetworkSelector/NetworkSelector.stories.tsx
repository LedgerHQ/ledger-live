import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { NetworkSelector } from ".";
import { ARB_ACCOUNT, ETH_ACCOUNT } from "../../../__mocks__/accounts.mock";
import {
  arbitrumCurrency,
  ethereumCurrency,
  mockNetworksConfiguration,
} from "../../../__mocks__/useSelectAssetFlow.mock";

const networks = [ethereumCurrency, arbitrumCurrency];

const onNetworkSelected = fn();

const preloadedAssetsDataApiState = {
  queries: {
    mockAssetsQuery: {
      data: {
        pages: [
          {
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
  accounts: [ETH_ACCOUNT, ARB_ACCOUNT],
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
    flow: "Modular Network Flow",
    source: "sourceTest",
  },
});

const initialMockState = createMockState();

const createStore = () =>
  configureStore({
    reducer: {
      accounts: (state = initialMockState.accounts) => state,
      wallet: (state = initialMockState.wallet) => state,
      discreet: () => false,
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

const meta: Meta<typeof NetworkSelector> = {
  title: "ModularDialog/NetworkSelection",
  component: NetworkSelector,
  args: {
    networks,
    networksConfiguration: mockNetworksConfiguration,
    onNetworkSelected: onNetworkSelected,
    selectedAssetId: ethereumCurrency.id,
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

type Story = StoryObj<typeof NetworkSelector>;

export const Default: Story = {
  args: {
    networksConfiguration: {
      leftElement: "undefined",
      rightElement: "undefined",
    },
  },
};

export const WithAccounts: Story = {
  args: {
    networksConfiguration: {
      leftElement: "numberOfAccounts",
      rightElement: "undefined",
    },
  },
};

export const WithAccountsAndApy: Story = {
  args: {
    networksConfiguration: {
      leftElement: "numberOfAccountsAndApy",
      rightElement: "undefined",
    },
  },
};

export const WithBalance: Story = {
  args: {
    networksConfiguration: {
      rightElement: "balance",
    },
  },
};

export const EmptyNetworks: Story = {
  args: {
    networks: [],
  },
};
