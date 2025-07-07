import type { Meta, StoryObj } from "@storybook/react";
import { NetworkItem } from "./NetworkItem";
import { createRightElement, leftElement } from "../sharedStoryBook";

const meta: Meta<typeof NetworkItem> = {
  component: NetworkItem,
  title: "PreLdls/Components/NetworkItem",
  tags: ["autodocs"],
  args: {
    name: "Bitcoin",
    id: "bitcoin",
    ticker: "btc",
    onClick: () => console.log("NetworkItem clicked"),
  },
};
export default meta;

type Story = StoryObj<typeof NetworkItem>;

export const Default: Story = {};

export const TestNetworkItem: Story = {};

export const NetworkItemWithLeftElement: Story = {
  args: {
    name: "Bitcoin",
    id: "bitcoin",
    ticker: "btc",
    leftElement,
  },
};

export const NetworkItemWithRightElement: Story = {
  args: {
    name: "Bitcoin",
    id: "bitcoin",
    ticker: "btc",
    rightElement: createRightElement(true),
  },
};
