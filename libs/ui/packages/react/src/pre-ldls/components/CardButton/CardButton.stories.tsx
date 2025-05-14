import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CardButton } from "./CardButton";
import { expect, fn, userEvent, within } from "@storybook/test";
import { Icons } from "../../../assets";

const meta: Meta<typeof CardButton> = {
  component: CardButton,
  title: "PreLdls/Components/CardButton",
  decorators: [
    Story => (
      <div style={{ display: "flex" }}>
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  args: {
    onClick: () => null,
    title: "Title",
    variant: "default",
  },
};
export default meta;

type Story = StoryObj<typeof CardButton>;

export const Default: Story = {};

export const Dashed: Story = {
  args: {
    onClick: () => null,
    title: "Title",
    variant: "dashed",
  },
};

export const IconRight: Story = {
  args: {
    onClick: () => null,
    title: "Title",
    iconRight: <Icons.Plus size="S" />,
  },
};

const onClick = fn();

export const TestOnClick: Story = {
  args: {
    onClick,
    title: "Title",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByText(/title/i);

    await userEvent.click(button);

    await expect(onClick).toHaveBeenCalled();
  },
};
