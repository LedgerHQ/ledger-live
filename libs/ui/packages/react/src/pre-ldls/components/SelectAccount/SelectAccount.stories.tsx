import type { Meta, StoryObj } from "@storybook/react";
import { SelectAccount } from "./SelectAccount";
import { expect, fn, userEvent, within } from "@storybook/test";

const meta: Meta<typeof SelectAccount> = {
  component: SelectAccount,
  title: "PreLdls/Components/SelectAccount",
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof SelectAccount>;

export const Default: Story = {};

const onClick = fn();

export const TestOnClick: Story = {
  args: {
    onClick,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByText(/Add new/i);

    await userEvent.click(button);

    await expect(onClick).toHaveBeenCalled();
  },
};
