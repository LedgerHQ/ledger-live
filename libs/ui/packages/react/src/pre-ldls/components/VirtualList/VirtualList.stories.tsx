import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { VirtualList } from "./VirtualList";

const meta: Meta<typeof VirtualList> = {
  component: VirtualList,
  title: "PreLdls/Components/VirtualList",
  tags: ["autodocs"],
  args: {},
};
export default meta;

type Story = StoryObj<typeof VirtualList>;

export const Default: Story = {
  args: {
    children: Array.from({ length: 50 }).map((_, i) => <h1>Item {i}</h1>),
    itemHeight: 64,
    maxHeight: 250,
  },
};
