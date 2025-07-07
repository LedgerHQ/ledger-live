import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import ModularDrawerAddAccountFlowManager, {
  ModularDrawerAddAccountFlowManagerProps,
} from "./ModularDrawerAddAccountFlowManager";
import { bitcoinCurrency } from "./__mocks__/useSelectAssetFlow.mock";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";

const store = createStore(() => ({
  //   accounts: [ARB_ACCOUNT, ETH_ACCOUNT, BTC_ACCOUNT],
  //   wallet: {
  //     accountNames: new Map([
  //       ["bitcoin1", "bitcoin-account-1"],
  //       ["ethereum1", "ethereum-account-1"],
  //       ["arbitrum1", "arbitrum-account-1"],
  //     ]),
  //   },
  //   currency: {
  //     type: "FiatCurrency",
  //     ticker: "USD",
  //     name: "US Dollar",
  //     symbol: "$",
  //     units: [
  //       {
  //         code: "$",
  //         name: "US Dollar",
  //         magnitude: 2,
  //         showAllDigits: true,
  //         prefixCode: true,
  //       },
  //     ],
  //   },
  //   application: { debug: {} },
}));

const meta: Meta<ModularDrawerAddAccountFlowManagerProps> = {
  title: "ModularDrawer/ModularDrawerAddAccountFlowManager",
  component: ModularDrawerAddAccountFlowManager,
  args: { currency: bitcoinCurrency },
  decorators: [
    Story => {
      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
};

export default meta;

export const ModularDrawerAddAccountFlow: StoryObj<ModularDrawerAddAccountFlowManagerProps> = {};
