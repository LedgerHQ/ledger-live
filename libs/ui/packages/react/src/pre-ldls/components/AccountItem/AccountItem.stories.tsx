import type { Meta, StoryObj } from "@storybook/react";
import { AccountItem } from "./AccountItem";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof AccountItem> = {
  component: AccountItem,
  title: "PreLdls/Components/AccountItem",
  tags: ["autodocs"],
  args: {
    name: "Main BTC",
    ticker: "BTC",
    balance: "0.118 ETH",
    fiatValue: "$5,969.83",
    address: "n4A9...Zgty",
  },
};
export default meta;

type Story = StoryObj<typeof AccountItem>;

export const Default: Story = {};

export const TestAccount: Story = {
  args: {
    name: "Main BTC",
    ticker: "BTC",
    balance: "0.118 BTC",
    fiatValue: "$5,969.83",
    protocol: "Native Segwit",
    address: "n4A9...Zgty",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("Main BTC");
    const protocol = canvas.getByTestId("tag");
    const address = canvas.getByText("n4A9...Zgty");
    const addressIcon = canvas.getByTestId("address-icon");
    const fiatValue = canvas.getByText("$5,969.83");
    const balance = canvas.getByText("0.118 BTC");

    await expect(name).toBeInTheDocument();
    await expect(protocol).toBeInTheDocument();
    await expect(protocol).toHaveTextContent("Native Segwit");
    await expect(address).toBeInTheDocument();
    await expect(addressIcon).toBeInTheDocument();
    await expect(fiatValue).toBeInTheDocument();
    await expect(balance).toBeInTheDocument();
  },
};

export const TestWithoutProtocol: Story = {
  args: {
    name: "Main BTC",
    ticker: "BTC",
    balance: "0.118 BTC",
    fiatValue: "$5,969.83",
    address: "n4A9...Zgty",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const protocol = canvas.queryByTestId("tag");

    await expect(protocol).not.toBeInTheDocument();
  },
};

export const TestWithoutAddressIcon: Story = {
  args: {
    name: "Main BTC",
    ticker: "BTC",
    balance: "0.118 BTC",
    fiatValue: "$5,969.83",
    address: "n4A9...Zgty",
    showIcon: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const addressIcon = canvas.queryByTestId("address-icon");

    await expect(addressIcon).not.toBeInTheDocument();
  },
};

// test a proper click
