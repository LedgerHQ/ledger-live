import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Icons } from "../../../assets";
import { TextInput, TextInputProps } from "./TextInput";

const meta: Meta<typeof TextInput> = {
  component: TextInput,
  title: "PreLdls/Components/TextInput",
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<TextInputProps>;

export const Default: Story = {
  args: {
    name: "plain",
    placeholder: "Type here",
  },
};

export const WithLabel: Story = {
  args: {
    name: "labelled",
    label: "Your comment",
    placeholder: "Write something",
  },
};

export const WithAdornments: Story = {
  args: {
    name: "adorned",
    startAdornment: <Icons.Search size="S" />,
    placeholder: "Search accounts",
  },
};

export const WithError: Story = {
  args: {
    name: "errorDemo",
    label: "Errored label",
    defaultValue: "-20.00",
    error: true,
    helperText: "Amount must be a positive number",
  },
};

export const Filled: Story = {
  args: {
    name: "filledDemo",
    defaultValue: "Clear me",
    helperText: "This is a filled input",
  },
};

export const Disabled: Story = {
  args: {
    name: "disabled",
    label: "Disabled label",
    placeholder: "Disabled",
    disabled: true,
  },
};
