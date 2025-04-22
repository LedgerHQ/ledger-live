import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { VirtualList } from "./VirtualList";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof VirtualList> = {
  component: VirtualList,
  decorators: [
    Story => (
      <div style={{ height: "400px" }}>
        <Story />
      </div>
    ),
  ],
  title: "PreLdls/Components/VirtualList",
  tags: ["autodocs"],
  args: {
    itemHeight: 64,
    count: 50,
    renderItem: (i: number) => <h1>Item #{i}</h1>,
  },
};
export default meta;

type Story = StoryObj<typeof VirtualList>;

export const Default: Story = {};

export const TestVirtualList: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const visible = canvas.getAllByText(/Item #/i);

    await expect(visible.length).toBeLessThanOrEqual(10);
  },
};
