import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Icons } from "../../../assets";
import type { PlayFnProps } from "../../types";
import { Input } from "./Input";

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
    icon: <Icons.Search size="S" />,
  },
};

// Interaction Testing
export const WithInteraction: Story = {
  args: {},
  play: async ({ canvasElement }: PlayFnProps) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "Write something");
    expect(input).toHaveValue("Write something");
  },
};
