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
import AssetSelector from ".";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";

const assetsToDisplay = [ethereumCurrency, arbitrumCurrency, bitcoinCurrency];
const onAssetSelected = fn();

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
  modularDrawer: {
    searchedValue: "",
  },
};

const store = createStore(() => defaultStore);

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
      <Provider store={store}>
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
  },
};
