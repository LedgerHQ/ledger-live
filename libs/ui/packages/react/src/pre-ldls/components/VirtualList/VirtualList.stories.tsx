import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { VirtualList } from "./VirtualList";
import { PlayFnProps } from "src/pre-ldls/types";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof VirtualList> = {
  component: VirtualList,
  title: "PreLdls/Components/VirtualList",
  tags: ["autodocs"],
  args: {
    children: Array.from({ length: 50 }).map((_, i) => <h1>Item #{i}</h1>),
    itemHeight: 64,
    maxHeight: 250,
  },
};
export default meta;

type Story = StoryObj<typeof VirtualList>;

export const Default: Story = {};

export const TestVirtualList: Story = {
  play: async ({ canvasElement }: PlayFnProps) => {
    const canvas = within(canvasElement);

    const visible = canvas.getAllByText(/Item #/i);

    await expect(visible.length).toBeLessThanOrEqual(10);
  },
};
