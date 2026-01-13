import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import AccountsWarning from ".";
import { bitcoinCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";

const store = createStore(() => ({ modularDrawer: { source: "someSource" } }));

const meta: Meta<typeof AccountsWarning> = {
  title: "ModularDialog/AccountsWarning",
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
