import React from "react";
import ScanAccounts from ".";
import type { Meta, StoryObj } from "@storybook/react";
import { bitcoinCurrency } from "../../__mocks__/useSelectAssetFlow.mock";
import { legacy_createStore as createStore } from "redux";
import { Provider } from "react-redux";
import { triggerComplete, triggerNext } from "../../__mocks__/bridge.mock";
import { BTC_ACCOUNT } from "../../__mocks__/accounts.mock";
import BigNumber from "bignumber.js";

const detailedAccount = {
  balance: new BigNumber(31918),
  creationDate: "2024-12-10T09:27:22.000Z",
  currency: bitcoinCurrency,
  derivationMode: "native_segwit",
  freshAddress: "mocked_fresh_address",
  id: "bitcoin1",
  type: "Account",
};

const store = createStore(() => ({
  accounts: [detailedAccount],
}));

const meta: Meta<typeof ScanAccounts> = {
  title: "ModularDrawer/ScanAccounts",
  component: ScanAccounts,
  args: {
    currency: bitcoinCurrency,
  },
  decorators: [
    Story => (
      <Provider store={store}>
        <button onClick={() => triggerNext(BTC_ACCOUNT)}>trigger next</button>
        <button onClick={() => triggerComplete()}>trigger complete</button>
        <Story />
      </Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ScanAccounts>;

export const Default: Story = {};
