import type { Meta, StoryObj } from "@storybook/react";
import { AssetList } from "./AssetList";
import { expect, fn, userEvent, within } from "@storybook/test";
import React from "react";

const testFn = fn();

const meta: Meta<typeof AssetList> = {
  component: AssetList,
  decorators: [
    Story => (
      <div style={{ height: "400px" }}>
        <Story />
      </div>
    ),
  ],
  title: "PreLdls/Components/AssetList",
  tags: ["autodocs"],
  args: {
    assets: Array.from({ length: 50 }).map((_, i) => ({
      name: `Bitcoin ${i}`,
      ticker: "BTC",
      id: "bitcoin",
    })),
    onClick: testFn,
    scrollToTop: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "AssetList displays a list of crypto assets. It supports virtual scrolling for performance with large datasets. Use it to represent selectable assets in lists.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AssetList>;

export const Default: Story = {};

export const WithFiatValue: Story = {
  args: {
    assets: Array.from({ length: 50 }).map((_, i) => ({
      name: `Bitcoin ${i}`,
      ticker: "BTC",
      id: "bitcoin",
      fiatValue: `$${(40000 + i * 100).toFixed(2)}`,
      balance: `${(0.1 + i * 0.01).toFixed(2)} BTC`,
    })),
  },
};

export const WithDiscreetModeEnabled: Story = {
  args: {
    assets: Array.from({ length: 50 }).map((_, i) => ({
      name: `Bitcoin ${i}`,
      ticker: "BTC",
      id: "bitcoin",
      fiatValue: `$***`,
      balance: `*** BTC`,
    })),
  },
};

export const TestAssetClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByText("Bitcoin 1");
    await userEvent.click(input);
    await expect(testFn).toHaveBeenCalledWith({ name: "Bitcoin 1", ticker: "BTC", id: "bitcoin" });
  },
};
