import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { NetworkList } from "./NetworkList";
import { expect, fn, userEvent, within } from "@storybook/test";

const testFn = fn();

const meta: Meta<typeof NetworkList> = {
  component: NetworkList,
  decorators: [
    Story => (
      <div style={{ height: "400px" }}>
        <Story />
      </div>
    ),
  ],
  title: "PreLdls/Components/NetworkList",
  tags: ["autodocs"],
  args: {
    networks: Array.from({ length: 50 }, (_, i) => ({
      name: `Bitcoin ${i}`,
      id: `bitcoin`,
      ticker: "btc",
    })),
    onClick: testFn,
  },
};
export default meta;

type Story = StoryObj<typeof NetworkList>;

export const Default: Story = {};

export const TestNetworkClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByText("Bitcoin 1");
    await userEvent.click(input);
    await expect(testFn).toHaveBeenCalledWith("bitcoin");
  },
};
