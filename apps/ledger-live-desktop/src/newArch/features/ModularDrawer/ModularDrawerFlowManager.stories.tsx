import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { legacy_createStore as createStore } from "redux";
import { Provider } from "react-redux";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  ethereumCurrency,
} from "./__mocks__/useSelectAssetFlow.mock";

const store = createStore(() => ({
  accounts: [],
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

const meta: Meta<typeof ModularDrawerFlowManager> = {
  title: "ModularDrawer/ModularDrawerFlowManager",
  component: ModularDrawerFlowManager,
  args: {
    currencies: [ethereumCurrency, arbitrumCurrency, bitcoinCurrency],
    drawerConfiguration: {},
    onAssetSelected: () => null,
    onAccountSelected: () => null,
  },
  decorators: [
    Story => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ModularDrawerFlowManager>;

export const Default: Story = {
  args: {},
};
