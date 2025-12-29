import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { NetworkSelector } from ".";
import { ARB_ACCOUNT, ETH_ACCOUNT } from "../../../__mocks__/accounts.mock";
import {
  arbitrumCurrency,
  ethereumCurrency,
  mockNetworksConfiguration,
} from "../../../__mocks__/useSelectAssetFlow.mock";

const networks = [ethereumCurrency, arbitrumCurrency];

const onNetworkSelected = fn();

const store = createStore(() => ({
  accounts: [ETH_ACCOUNT, ARB_ACCOUNT],
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

const meta: Meta<typeof NetworkSelector> = {
  title: "ModularDrawer/NetworkSelection",
  component: NetworkSelector,
  args: {
    networks,
    networksConfiguration: mockNetworksConfiguration,
    onNetworkSelected: onNetworkSelected,
    selectedAssetId: ethereumCurrency.id,
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
    },
  },
};

export const WithAccountsAndApy: Story = {
  args: {
    networksConfiguration: {
      leftElement: "numberOfAccountsAndApy",
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
