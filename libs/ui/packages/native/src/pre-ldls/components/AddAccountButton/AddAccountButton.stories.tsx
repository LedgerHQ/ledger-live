import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { AddAccountButton } from "./AddAccountButton";

const meta: Meta<typeof AddAccountButton> = {
  component: AddAccountButton,
  decorators: [
    (Story: React.ComponentType) => (
      <View style={{ height: 400, width: 400 }}>
        <Story />
      </View>
    ),
  ],
  title: "PreLdls/Components/AddAccountButton",
  tags: ["autodocs"],
  args: {
    t: (key: string) => key,
    onClick: () => {},
    label: "Add new or existing account",
  },
};

export default meta;

type Story = StoryObj<typeof AddAccountButton>;

export const Default: Story = {};
