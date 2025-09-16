import { type Meta, type StoryObj } from "@storybook/react";
import { ApyIndicator } from "./ApyIndicator";
import { expect } from "@storybook/jest";
import { within } from "@storybook/testing-library";

const meta: Meta<typeof ApyIndicator> = {
  component: ApyIndicator,
  title: "PreLdls/Components/ApyIndicator",
  tags: ["autodocs"],
  args: { value: 30, type: "APY" },
};
export default meta;

type Story = StoryObj<typeof ApyIndicator>;

export const Default: Story = {};

export const APY: Story = { args: { value: 30, type: "APY" } };
export const APR: Story = { args: { value: 20, type: "APR" } };
export const NRR: Story = { args: { value: 10, type: "NRR" } };

export const TestApyIndicator: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("tag");
    await expect(input).toHaveTextContent("~ 30% APY");
  },
};
