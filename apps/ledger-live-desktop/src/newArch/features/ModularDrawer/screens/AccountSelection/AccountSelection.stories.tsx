import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import BigNumber from "bignumber.js";
import React from "react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { track } from "~/renderer/analytics/__mocks__/segment";
import { AccountSelection } from ".";
import { bitcoinCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";

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

const defaultStore = {
  accounts: [detailedAccount, detailedAccount2, detailedAccount3],
  wallet: {
    accountNames: new Map([
      ["bitcoin1", "bitcoin-account-1"],
      ["bitcoin2", "bitcoin-account-2"],
      ["bitcoin3", "bitcoin-account-3"],
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
};

const store = createStore(() => defaultStore);

const onAccountSelected = fn();

const meta: Meta<typeof AccountSelection> = {
  title: "ModularDrawer/AccountSelection",
  component: AccountSelection,
  args: {
    asset: bitcoinCurrency,
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
    asset: bitcoinCurrency,
    onAccountSelected,
  },
};

export const NoAccounts: Story = {
  args: {
    asset: bitcoinCurrency,
    onAccountSelected,
  },
  decorators: [
    Story => (
      <div style={{ width: "100%", height: "100%" }}>
        <Provider store={createStore(() => ({ ...defaultStore, accounts: [] }))}>
          <Story />
        </Provider>
      </div>
    ),
  ],
};

export const SelectAccountFor1CurrencyStory: Story = {
  args: {
    asset: bitcoinCurrency,
    onAccountSelected,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bitcoinAccount = canvas.getByText(/bitcoin-account-1/i);
    await userEvent.click(bitcoinAccount);
    expect(onAccountSelected).toHaveBeenCalledWith(detailedAccount);
    expect(track).toHaveBeenLastCalledWith("account_clicked", {
      currency: "Bitcoin",
      flow: "Modular Account Flow",
      page: "Account Selection",
      source: "Accounts",
    });
  },
};
