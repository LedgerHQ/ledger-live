import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountList } from "./AccountList";
import { expect, fn, userEvent, within } from "@storybook/test";

const testFn = fn();

const meta: Meta<typeof AccountList> = {
  component: AccountList,
  decorators: [
    Story => (
      <div style={{ height: "400px" }}>
        <Story />
      </div>
    ),
  ],
  title: "PreLdls/Components/AccountList",
  tags: ["autodocs"],
  args: {
    accounts: Array.from({ length: 50 }, (_, i) => {
      const p = Math.random() > 0.5;
      return {
        name: p ? `Bitcoin ${i}` : `Ethereum ${i}`,
        id: p ? `btc${i}` : `eth${i}`,
        ticker: p ? "BTC" : "ETH",
        balance: p ? "0.004 BTC" : "0.004 ETH",
        fiatValue: p ? "£288.53" : "£5.53",
        protocol: p ? "Native Segwit" : "",
        address: p ? "aJf2...ffa3d" : "nIl4...f72n",
      };
    }),
    onClick: testFn,
  },
};

export default meta;

type Story = StoryObj<typeof AccountList>;

export const Default: Story = {};

export const TestAccountClick: Story = {
  play: async ({ canvasElement }) => {
    // TODO does this need to be more comprehensive
    // and to actually support the proper payload of a click callback
    const canvas = within(canvasElement);
    const input = canvas.getByText("Bitcoin 1");
    await userEvent.click(input);
    await expect(testFn).toHaveBeenCalledWith("btc1");
  },
};
