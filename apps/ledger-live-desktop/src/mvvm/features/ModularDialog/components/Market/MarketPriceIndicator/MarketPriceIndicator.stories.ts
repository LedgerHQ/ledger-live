import type { Meta, StoryObj } from "@storybook/react";
import { MarketPriceIndicator } from "./index";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof MarketPriceIndicator> = {
  component: MarketPriceIndicator,
  title: "ModularDialog/Components/MarketPriceIndicator",
  tags: ["autodocs"],
  args: { percent: 30, price: "$100,000.00" },
};
export default meta;

type Story = StoryObj<typeof MarketPriceIndicator>;

export const Positive: Story = { args: { percent: 30, price: "$100,000.00" } };
export const Negative: Story = { args: { percent: -30, price: "$100,000.00" } };
export const Zero: Story = { args: { percent: 0, price: "$100,000.00" } };

export const TestMarketPriceIndicator: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("market-price-indicator");
    await expect(input).toHaveTextContent("$100,000.00");
  },
};
