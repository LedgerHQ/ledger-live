import type { Meta, StoryObj } from "@storybook/react";
import { AssetItem } from "./AssetItem";
import { expect, within } from "@storybook/test";
import { createRightElement, leftElement } from "../sharedStoryBook";

const meta: Meta<typeof AssetItem> = {
  component: AssetItem,
  title: "PreLdls/Components/AssetItem",
  tags: ["autodocs"],
  args: { name: "Bitcoin", ticker: "BTC", id: "bitcoin" },
  parameters: {
    docs: {
      description: {
        component:
          "AssetItem displays a crypto asset with its name, ticker, icon, and optionally fiat value and balance. Use it to represent selectable assets in lists.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AssetItem>;

export const Default: Story = {};

export const WithBalance: Story = {
  args: {
    name: "Bitcoin",
    ticker: "BTC",
    id: "bitcoin",
    rightElement: createRightElement(false),
  },
};

export const WithTag: Story = {
  args: {
    name: "Bitcoin",
    ticker: "BTC",
    id: "bitcoin",
    leftElement: leftElement,
  },
};

export const WithLeftTagAndRightBalance: Story = {
  args: {
    name: "Bitcoin",
    ticker: "BTC",
    id: "bitcoin",
    leftElement: leftElement,
    rightElement: createRightElement(false),
  },
};

export const WithDiscreetModeEnabled: Story = {
  args: {
    name: "Bitcoin",
    ticker: "BTC",
    id: "bitcoin",
    rightElement: createRightElement(true),
  },
};

export const TestAssetItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("Bitcoin");
    const ticker = canvas.getByText("BTC");

    await expect(name).toBeInTheDocument();
    await expect(ticker).toBeInTheDocument();
  },
};
