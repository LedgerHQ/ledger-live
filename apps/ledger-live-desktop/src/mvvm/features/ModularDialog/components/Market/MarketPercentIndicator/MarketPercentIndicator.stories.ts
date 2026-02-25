import type { Meta, StoryObj } from "@storybook/react";
import { MarketPercentIndicator } from "./index";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof MarketPercentIndicator> = {
  component: MarketPercentIndicator,
  title: "ModularDialog/Components/MarketPercentIndicator",
  tags: ["autodocs"],
  args: { percent: 30 },
};
export default meta;

type Story = StoryObj<typeof MarketPercentIndicator>;

export const Positive: Story = { args: { percent: 30 } };
export const Negative: Story = { args: { percent: -30 } };
export const Zero: Story = { args: { percent: 0 } };

export const TestMarketPercentIndicator: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("market-percent-indicator");
    await expect(input).toHaveTextContent("+30%");
  },
};
