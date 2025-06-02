import React from "react";
import ConnectYourDevice from "./";
import type { Meta, StoryObj } from "@storybook/react";
import { bitcoinCurrency } from "../../__mocks__/useSelectAssetFlow.mock";

const meta: Meta<typeof ConnectYourDevice> = {
  title: "ModularDrawer/AddAccount",
  component: ConnectYourDevice,
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

type Story = StoryObj<typeof ConnectYourDevice>;

export const Default: Story = {};
