import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "@storybook/test";
import { AccountItem } from "./AccountItem";

const onClick = fn();

const meta: Meta<typeof AccountItem> = {
  component: AccountItem,
  title: "PreLdls/Components/AccountItem",
  tags: ["autodocs"],
  args: {
    onClick: onClick,
    account: {
      address: "n4A9323232Zgty",
      balance: "0.118 ETH",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
  },
};
export default meta;

type Story = StoryObj<typeof AccountItem>;

export const Default: Story = {};

export const TestAccount: Story = {
  args: {
    onClick: onClick,
    account: {
      address: "n4A9323232Zgty",
      balance: "0.118 BTC",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      protocol: "Native Segwit",
      ticker: "btc",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("Main BTC");
    const protocol = canvas.getByTestId("tag");
    const address = canvas.getByText("n4A93...2Zgty");
    const addressIcon = canvas.getByRole("img");
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
    onClick: onClick,
    account: {
      address: "n4A9323232Zgty",
      balance: "0.118 BTC",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "21345",
      name: "Main BTC",
      ticker: "btc",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const protocol = canvas.queryByTestId("tag");

    await expect(protocol).not.toBeInTheDocument();
  },
};

export const TestWithoutAddressIcon: Story = {
  args: {
    onClick: onClick,
    account: {
      address: "n4A9323232Zgty",
      balance: "0.118 BTC",
      fiatValue: "$5,969.83",
      id: "bitcoin",
      name: "Main BTC",
    },
    showIcon: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const addressIcon = canvas.queryByRole("img");

    await expect(addressIcon).not.toBeInTheDocument();
  },
};

export const TestWithCheckbox: Story = {
  args: {
    account: {
      address: "n4A9323232Zgty",
      balance: "0.118",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
    onClick,
    rightElement: {
      type: "checkbox",
      checkbox: {
        isChecked: false,
        name: "checkbox",
        onChange: () => {},
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const arrowIcon = canvas.getByTestId("right-element-checkbox");

    await expect(arrowIcon).toBeInTheDocument();
  },
};

export const TestWithArrow: Story = {
  args: {
    account: {
      address: "n4A9323232Zgty",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
    rightElement: {
      type: "arrow",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const arrowIcon = canvas.getByTestId("right-element-arrow-icon");

    await expect(arrowIcon).toBeInTheDocument();
  },
};

export const TestWithEdit: Story = {
  args: {
    account: {
      address: "n4A9323232Zgty",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
    onClick: undefined,
    rightElement: {
      type: "edit",
      onClick,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const arrowIcon = canvas.getByTestId("right-element-edit-icon");

    await expect(arrowIcon).toBeInTheDocument();
  },
};
