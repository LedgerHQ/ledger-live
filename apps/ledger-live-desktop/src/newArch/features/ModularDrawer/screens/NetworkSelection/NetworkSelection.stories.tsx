import React from "react";
import { NetworkSelection } from ".";
import type { Meta, StoryObj } from "@storybook/react";
import {
  arbitrumCurrency,
  ethereumCurrency,
  mockNetworksConfiguration,
} from "../../__mocks__/useSelectAssetFlow.mock";
import { fn } from "@storybook/test";

const networks = [ethereumCurrency, arbitrumCurrency];

const onNetworkSelected = fn();

const meta: Meta<typeof NetworkSelection> = {
  title: "ModularDrawer/NetworkSelection",
  component: NetworkSelection,
  args: {
    networks,
    networksConfiguration: mockNetworksConfiguration,
    onNetworkSelected: onNetworkSelected,
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

type Story = StoryObj<typeof NetworkSelection>;

export const Default: Story = {};

export const EmptyNetworks: Story = {
  args: {
    networks: [],
  },
};
