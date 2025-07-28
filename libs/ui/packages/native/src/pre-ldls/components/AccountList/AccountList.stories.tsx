import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { AccountList } from "./AccountList";

const meta: Meta<typeof AccountList> = {
  component: AccountList,
  decorators: [
    (Story: React.ComponentType) => (
      <View style={{ height: 400, width: 400 }}>
        <Story />
      </View>
    ),
  ],
  title: "PreLdls/Components/AccountList",
  tags: ["autodocs"],
  args: {
    accounts: Array.from({ length: 50 }, (_, i) => ({
      name: `Bitcoin ${i}`,
      id: `btc${i}`,
      balance: "0.004 BTC",
      fiatValue: "$288.53",
      protocol: "Native Segwit",
      address: "n4A9...Zgty",
      ticker: "btc",
      cryptoId: "bitcoin",
    })),
    onClick: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof AccountList>;

export const Default: Story = {};
