import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { ARB_ACCOUNT } from "../../../__mocks__/accounts.mock";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  mockAssetsConfiguration,
} from "../../../__mocks__/useSelectAssetFlow.mock";
import AssetSelection from "../AssetSelection";

const assetsToDisplay = [ethereumCurrency, arbitrumCurrency, bitcoinCurrency];
const sortedCryptoCurrencies = [bitcoinCurrency, ethereumCurrency, arbitrumCurrency];
const onAssetSelected = fn();
const setAssetsToDisplay = fn();
const setSearchedValue = fn();

const defaultStore = {
  accounts: [ARB_ACCOUNT],
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
};

const store = createStore(() => defaultStore);

const meta: Meta<typeof AssetSelection> = {
  title: "ModularDrawer/AssetSelection",
  component: AssetSelection,
  args: {
    assetsToDisplay,
    originalAssetsToDisplay: assetsToDisplay,
    sortedCryptoCurrencies,
    assetsConfiguration: {},
    currenciesByProvider: [],
    setAssetsToDisplay: setAssetsToDisplay,
    onAssetSelected: onAssetSelected,
    setSearchedValue: setSearchedValue,
    flow: "test",
    source: "storybook",
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

type Story = StoryObj<typeof AssetSelection>;

export const Default: Story = {};

export const WithDefaultSearchValue: Story = {
  args: {
    defaultSearchValue: "eth",
  },
};

export const WithBalance: Story = {
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
      const discreetModeStore = createStore(() => ({
        ...defaultStore,
        discreet: true,
      }));

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
    originalAssetsToDisplay: [],
    sortedCryptoCurrencies: [],
  },
};
