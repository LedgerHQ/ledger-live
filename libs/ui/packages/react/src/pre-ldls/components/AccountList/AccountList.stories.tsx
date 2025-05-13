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
      return {
        name: `Bitcoin ${i}`,
        id: `btc${i}`,
        balance: "0.004 BTC",
        fiatValue: "£288.53",
        protocol: "Native Segwit",
        address: "n4A9...Zgty",
        ticker: "btc",
        cryptoId: "bitcoin",
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
    const canvas = within(canvasElement);
    const input = canvas.getByText("Bitcoin 1");
    await userEvent.click(input);
    await expect(testFn).toHaveBeenCalledWith("btc1");
  },
};
