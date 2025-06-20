import React from "react";
import { NetworkSelection } from ".";
import type { Meta, StoryObj } from "@storybook/react";
import {
  arbitrumCurrency,
  ethereumCurrency,
  mockNetworksConfiguration,
} from "../../__mocks__/useSelectAssetFlow.mock";
import { legacy_createStore as createStore } from "redux";
import { Provider } from "react-redux";
import { fn } from "@storybook/test";
import { res } from "../../__mocks__/useGroupedCurrenciesByProvider.mock";
import { ETH_ACCOUNT, ARB_ACCOUNT } from "../../__mocks__/accounts.mock";

const networks = [ethereumCurrency, arbitrumCurrency];

const onNetworkSelected = fn();

const store = createStore(() => ({
  accounts: [ETH_ACCOUNT, ARB_ACCOUNT],
  //   wallet: {
  //   accountNames: new Map([
  //     ["bitcoin1", "bitcoin-account-1"],
  //     ["ethereum1", "ethereum-account-1"],
  //     ["arbitrum1", "arbitrum-account-1"],
  //   ]),
  // },
  // discreet: false,
  // locale: "en-US",
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
}));

const meta: Meta<typeof NetworkSelection> = {
  title: "ModularDrawer/NetworkSelection",
  component: NetworkSelection,
  args: {
    networks,
    networksConfiguration: mockNetworksConfiguration,
    onNetworkSelected: onNetworkSelected,
    selectedAssetId: ethereumCurrency.id,
    currenciesByProvider: res.result.currenciesByProvider,
  },
  decorators: [
    Story => (
      <Provider store={store}>
        <div style={{ width: "100%", height: "100%" }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof NetworkSelection>;

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
