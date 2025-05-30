import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { legacy_createStore as createStore } from "redux";
import { Provider } from "react-redux";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import {
  arbitrumCurrency,
  arbitrumToken,
  bitcoinCurrency,
  ethereumCurrency,
} from "./__mocks__/useSelectAssetFlow.mock";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { track } from "~/renderer/analytics/__mocks__/segment";
import { MOCKED_ARB_ACCOUNT } from "./__mocks__/accounts.mock";

const store = createStore(() => ({
  accounts: [],
  wallet: {
    accountNames: new Map([
      ["bitcoin1", "bitcoin-account-1"],
      ["ethereum1", "ethereum-account-1"],
      ["arbitrum1", "arbitrum-account-1"],
    ]),
  },
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

const onAssetSelected = fn();
const onAccountSelected = fn();

const meta: Meta<typeof ModularDrawerFlowManager> = {
  title: "ModularDrawer/ModularDrawerFlowManager",
  component: ModularDrawerFlowManager,
  args: {
    currencies: [ethereumCurrency, arbitrumCurrency, arbitrumToken, bitcoinCurrency],
    drawerConfiguration: {},
    onAssetSelected,
    onAccountSelected,
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

export const TestSelectAccountFlow: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const waitForAnimationExit = (text: RegExp) =>
      waitFor(() => {
        const [el] = canvas.queryAllByText(text);
        if (canvas.queryAllByText(text).length !== 1) throw new Error();
        return el;
      });
    const ethereumAsset = canvas.getByText(/ethereum/i);

    await userEvent.click(ethereumAsset);

    expect(track).toHaveBeenLastCalledWith("asset_clicked", {
      asset: {
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
      },
      flow: "Modular Asset Flow",
      page: "Modular Asset Selection",
    });

    const arbitrumNetwork = await waitForAnimationExit(/arbitrum/i);

    await userEvent.click(arbitrumNetwork);

    const arbitrumAccount = await waitForAnimationExit(/arbitrum-account-1/i);
    expect(arbitrumAccount).toBeInTheDocument();

    await userEvent.click(arbitrumAccount);

    expect(onAccountSelected).toHaveBeenCalledWith(MOCKED_ARB_ACCOUNT, undefined);
  },
};
