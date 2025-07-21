import type { Meta, StoryObj } from "@storybook/react";
import { NetworkItem } from "./NetworkItem";
import { expect, within } from "@storybook/test";
import { createRightElement, leftElement } from "../sharedStoryBook";

const meta: Meta<typeof NetworkItem> = {
  component: NetworkItem,
  title: "PreLdls/Components/NetworkItem",
  tags: ["autodocs"],
  args: {
    name: "Bitcoin",
    id: "bitcoin",
    ticker: "btc",
  },
};
export default meta;

type Story = StoryObj<typeof NetworkItem>;

export const Default: Story = {};

export const TestNetworkItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("Bitcoin");

    await expect(name).toBeInTheDocument();
  },
};

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
