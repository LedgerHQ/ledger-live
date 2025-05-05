import type { Meta, StoryObj } from "@storybook/react";
import { AssetItem } from "./AssetItem";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof AssetItem> = {
  component: AssetItem,
  title: "PreLdls/Components/AssetItem",
  tags: ["autodocs"],
  args: { name: "Bitcoin", ticker: "BTC" },
};
export default meta;

type Story = StoryObj<typeof AssetItem>;

export const Default: Story = {};

export const TestAssetItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("Bitcoin");
    const ticker = canvas.getByText("BTC");

    await expect(name).toBeInTheDocument();
    await expect(ticker).toBeInTheDocument();
  },
};
