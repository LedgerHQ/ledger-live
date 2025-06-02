import type { Meta, StoryObj } from "@storybook/react";
import { AssetItem } from "./AssetItem";
import { expect, within } from "@storybook/test";

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

export const WithFiatValue: Story = {
  args: {
    name: "Bitcoin",
    ticker: "BTC",
    id: "bitcoin",
    fiatValue: "$40,000.12",
    balance: "0.2 BTC",
  },
};

export const WithDiscreetModeEnabled: Story = {
  args: {
    name: "Bitcoin",
    ticker: "BTC",
    id: "bitcoin",
    fiatValue: "$***",
    balance: "*** BTC",
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
