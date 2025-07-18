import type { Meta, StoryObj } from "@storybook/react";
import { NetworkList } from "./NetworkList";
import React from "react";
import { View } from "react-native";

const meta: Meta<typeof NetworkList> = {
  component: NetworkList,
  title: "PreLdls/Components/NetworkList",
  tags: ["autodocs"],
  args: {
    networks: Array.from({ length: 50 }, (_, i) => ({
      name: `Bitcoin ${i}`,
      id: `bitcoin`,
      ticker: "btc",
    })),
  },
  decorators: [
    (Story: React.ComponentType) => (
      <View style={{ height: 600, width: "100%" }}>
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NetworkList>;

export const Default: Story = {};

export const TestNetworkClick: Story = {
  args: {
    networks: Array.from({ length: 3 }, (_, i) => ({
      name: `Bitcoin ${i}`,
      id: `bitcoin`,
      ticker: "btc",
    })),
  },
};
