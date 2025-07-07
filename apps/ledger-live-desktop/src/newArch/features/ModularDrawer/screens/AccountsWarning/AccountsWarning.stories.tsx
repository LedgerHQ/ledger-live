import React from "react";
import AccountsWarning from ".";
import type { Meta, StoryObj } from "@storybook/react";
import { bitcoinCurrency } from "../../__mocks__/useSelectAssetFlow.mock";
import { legacy_createStore as createStore } from "redux";
import { Provider } from "react-redux";

const store = createStore(() => ({}));

const meta: Meta<typeof AccountsWarning> = {
  title: "ModularDrawer/AccountsWarning",
  component: AccountsWarning,
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

type Story = StoryObj<typeof AccountsWarning>;

export const Default: Story = {};
