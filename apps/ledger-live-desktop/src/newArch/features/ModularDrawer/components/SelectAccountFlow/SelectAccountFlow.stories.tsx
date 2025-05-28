import React from "react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { SelectAccountFlow } from ".";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { getAccountTuplesForCurrency } from "./hooks/__mocks__/useDetailedAccounts.mock";
import BigNumber from "bignumber.js";
import { track } from "~/renderer/analytics/__mocks__/segment";
import { bitcoinCurrency } from "../SelectAssetFlow/__mocks__/useSelectAssetFlow.mock";

type Story = StoryObj<typeof SelectAccountFlow>;

const store = createStore(() => ({
  accounts: [],
  wallet: { accountNames: new Map([["bitcoin1", "bitcoin-account-1"]]) },
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
}));

const onAccountSelected = fn();

const Meta: Meta<typeof SelectAccountFlow> = {
  decorators: [
    Story => (
      <div style={{ height: 500 }}>
        <Provider store={store}>
          <Story />
        </Provider>
      </div>
    ),
  ],
  component: SelectAccountFlow,
  title: "SelectAccountFlow",
  tags: ["autodocs"],
  args: {
    onAccountSelected,
    currencies: [],
  },
};

export default Meta;

const detailedAccount = {
  balance: new BigNumber(31918),
  creationDate: "2024-12-10T09:27:22.000Z",
  currency: bitcoinCurrency,
  derivationMode: "native_segwit",
  freshAddress: "mocked_fresh_address",
  id: "bitcoin1",
  type: "Account",
};

export const SelectAccountFlowStory: Story = {
  beforeEach: () => {
    getAccountTuplesForCurrency.mockImplementation(() => [
      {
        account: detailedAccount,
      },
    ]);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bitcoinAsset = canvas.getByText(/bitcoin/i);
    await userEvent.click(bitcoinAsset);

    expect(track).lastCalledWith("asset_clicked", {
      asset: {
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
      },
      flow: "Modular Asset Flow",
      page: "Modular Asset Selection",
    });

    const bitcoinAccount = canvas.getByText(/bitcoin-account-1/i);
    await userEvent.click(bitcoinAccount);

    expect(onAccountSelected).toHaveBeenCalledWith(detailedAccount);
    expect(track).lastCalledWith("account_clicked", {
      currency: "BTC",
      flow: "Modular Account Flow",
      page: "Modular Account Selection",
    });
  },
};

export const SelectAccountFor1CurrencyStory: Story = {
  args: {
    currencies: [bitcoinCurrency],
  },
  beforeEach: () => {
    getAccountTuplesForCurrency.mockImplementation(() => [
      {
        account: detailedAccount,
      },
    ]);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bitcoinAccount = canvas.getByText(/bitcoin-account-1/i);

    await userEvent.click(bitcoinAccount);

    expect(onAccountSelected).toHaveBeenCalledWith(detailedAccount);
    expect(track).lastCalledWith("account_clicked", {
      currency: "BTC",
      flow: "Modular Account Flow",
      page: "Modular Account Selection",
    });
  },
};
