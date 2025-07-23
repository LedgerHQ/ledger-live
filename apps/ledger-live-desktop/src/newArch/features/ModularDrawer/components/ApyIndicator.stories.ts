import type { Meta, StoryObj } from "@storybook/react";
import ApyIndicator from "./ApyIndicator";

const meta: Meta<typeof ApyIndicator> = {
  component: ApyIndicator,
  title: "ModularDrawer/Atoms/ApyIndicator",
  tags: ["autodocs"],
  args: { value: 30, type: "APY" },
};
export default meta;

type Story = StoryObj<typeof ApyIndicator>;

export const APY: Story = { args: { value: 30, type: "APY" } };
export const APR: Story = { args: { value: 30, type: "APR" } };
