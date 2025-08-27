import type { Meta, StoryObj } from "@storybook/react";
import { ApyIndicator } from "./ApyIndicator";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof ApyIndicator> = {
  component: ApyIndicator,
  title: "PreLdls/Components/ApyIndicator",
  tags: ["autodocs"],
  args: { value: 30, type: "APY" },
};
export default meta;

type Story = StoryObj<typeof ApyIndicator>;

export const APY: Story = { args: { value: 30, type: "APY" } };
export const APR: Story = { args: { value: 30, type: "APR" } };
export const NRR: Story = { args: { value: 30, type: "NRR" } };

export const TestApyIndicator: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("tag");
    await expect(input).toHaveTextContent("~ 30% APY");
  },
};
