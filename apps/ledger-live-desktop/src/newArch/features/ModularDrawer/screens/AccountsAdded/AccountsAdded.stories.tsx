import React from "react";
import AccountsAdded from "./";
import type { Meta, StoryObj } from "@storybook/react";
import { bitcoinCurrency } from "../../__mocks__/useSelectAssetFlow.mock";

const meta: Meta<typeof AccountsAdded> = {
  title: "ModularDrawer/AddAccount",
  component: AccountsAdded,
  args: {
    currency: bitcoinCurrency,
  },
  decorators: [
    Story => (
      <div style={{ width: "100%", height: "100%" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AccountsAdded>;

export const Default: Story = {};
