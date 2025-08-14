import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { Icons } from "../../../assets";
import { Input, IconProps } from "./Input";

const meta: Meta<typeof Input> = {
  component: Input,
  title: "PreLdls/Components/Input",
  tags: ["autodocs"],
  args: {},
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {},
};

export const Search: Story = {
  args: {
    placeholder: "Search",
    icon: (props: IconProps) => <Icons.Search size="S" {...props} />,
  },
};

// Interaction Testing
export const WithInteraction: Story = {
  args: {},
  controls: { expanded: true },

  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "Write something");
    expect(input).toHaveValue("Write something");
  },
};
