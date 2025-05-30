import React from "react";
import { AccountSelection } from ".";
import type { Meta, StoryObj } from "@storybook/react";
import { ethereumCurrency, bitcoinCurrency } from "../../__mocks__/useSelectAssetFlow.mock";
import { getAccountTuplesForCurrency } from "../../__mocks__/accounts.mock";
import BigNumber from "bignumber.js";
import { legacy_createStore as createStore } from "redux";
import { Provider } from "react-redux";
import { expect, fn, userEvent, within } from "@storybook/test";
import { track } from "~/renderer/analytics/__mocks__/segment";

const store = createStore(() => ({
  accounts: [],
  wallet: {
    accountNames: new Map([
      ["bitcoin1", "Bitcoin 1"],
      ["bitcoin2", "Bitcoin 2"],
      ["bitcoin3", "Bitcoin 3"],
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
}));

const detailedAccount = {
  balance: new BigNumber(31918),
  creationDate: "2024-12-10T09:27:22.000Z",
  currency: bitcoinCurrency,
  derivationMode: "native_segwit",
  freshAddress: "mocked_fresh_address",
  id: "bitcoin1",
  type: "Account",
};

const detailedAccount2 = {
  balance: new BigNumber(100000),
  creationDate: "2024-12-11T10:00:00.000Z",
  currency: bitcoinCurrency,
  derivationMode: "native_segwit",
  freshAddress: "mocked_fresh_address_2",
  id: "bitcoin2",
  type: "Account",
};

const detailedAccount3 = {
  balance: new BigNumber(50000),
  creationDate: "2024-12-12T11:00:00.000Z",
  currency: bitcoinCurrency,
  derivationMode: "native_segwit",
  freshAddress: "mocked_fresh_address_3",
  id: "bitcoin3",
  type: "Account",
};

const onAccountSelected = fn();

const meta: Meta<typeof AccountSelection> = {
  title: "ModularDrawer/AccountSelection",
  component: AccountSelection,
  args: {
    asset: ethereumCurrency,
    source: "Accounts",
    flow: "Modular Account Flow",
    onAccountSelected: onAccountSelected(),
  },
  decorators: [
    Story => (
      <div style={{ width: "100%", height: "100%" }}>
        <Provider store={store}>
          <Story />
        </Provider>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AccountSelection>;

export const Default: Story = {
  args: {
    asset: ethereumCurrency,
    source: "Accounts",
    flow: "Modular Account Flow",
    onAccountSelected,
  },
  render: args => {
    getAccountTuplesForCurrency.mockImplementation(() => [
      { account: detailedAccount },
      { account: detailedAccount2 },
      { account: detailedAccount3 },
    ]);
    return <AccountSelection {...args} />;
  },
};

export const NoAccounts: Story = {
  args: {
    asset: ethereumCurrency,
    source: "Accounts",
    flow: "Modular Account Flow",
    onAccountSelected,
  },
  render: args => {
    getAccountTuplesForCurrency.mockImplementation(() => []);
    return <AccountSelection {...args} />;
  },
};

export const SelectAccountFor1CurrencyStory: Story = {
  args: {
    asset: bitcoinCurrency,
    source: "Accounts",
    flow: "Modular Account Flow",
    onAccountSelected,
  },
  render: args => {
    getAccountTuplesForCurrency.mockImplementation(() => [
      { account: detailedAccount },
      { account: detailedAccount2 },
      { account: detailedAccount3 },
    ]);
    return <AccountSelection {...args} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bitcoinAccount = canvas.getByText(/bitcoin-account-1/i);
    await userEvent.click(bitcoinAccount);
    expect(onAccountSelected).toHaveBeenCalledWith(detailedAccount);
    expect(track).toHaveBeenLastCalledWith("account_clicked", {
      currency: "BTC",
      flow: "Modular Account Flow",
      page: "Modular Account Selection",
    });
  },
};
