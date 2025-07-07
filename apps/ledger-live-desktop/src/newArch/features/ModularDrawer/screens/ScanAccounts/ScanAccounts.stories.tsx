import React from "react";
import ScanAccounts from ".";
import type { Meta, StoryObj } from "@storybook/react";
import { bitcoinCurrency } from "../../__mocks__/useSelectAssetFlow.mock";
import { legacy_createStore as createStore } from "redux";
import { Provider } from "react-redux";

const store = createStore(() => ({}));

const meta: Meta<typeof ScanAccounts> = {
  title: "ModularDrawer/ScanAccounts",
  component: ScanAccounts,
  args: {
    currency: bitcoinCurrency,
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

type Story = StoryObj<typeof ScanAccounts>;

export const Default: Story = {};
