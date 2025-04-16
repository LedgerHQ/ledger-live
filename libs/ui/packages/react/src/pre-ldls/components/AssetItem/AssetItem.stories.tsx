import type { Meta, StoryObj } from "@storybook/react";
import { AssetItem } from "./AssetItem";

const meta: Meta<typeof AssetItem> = {
  component: AssetItem,
  title: "PreLdls/Components/AssetItem",
  tags: ["autodocs"],
  args: {},
};
export default meta;

type Story = StoryObj<typeof AssetItem>;

export const Default: Story = {
  args: { name: "Bitcoin", ticker: "BTC" },
};
