import type { Meta, StoryObj } from "@storybook/react";
import { AccountItem, AccountItemProps } from "./AccountItem";
import { expect, fn, within } from "@storybook/test";

const onClick = fn();

const meta: Meta<typeof AccountItem> = {
  component: AccountItem,
  title: "PreLdls/Components/AccountItem",
  tags: ["autodocs"],
  args: {
    onClick: onClick,
    account: {
      id: "12345",
      cryptoId: "bitcoin",
      name: "Main BTC",
      balance: "0.118 ETH",
      fiatValue: "$5,969.83",
      address: "n4A9...Zgty",
      ticker: "btc",
    },
  } satisfies AccountItemProps,
};
export default meta;

type Story = StoryObj<typeof AccountItem>;

export const Default: Story = {};

export const TestAccount: Story = {
  args: {
    onClick: onClick,
    account: {
      id: "12345",
      cryptoId: "bitcoin",
      name: "Main BTC",
      balance: "0.118 BTC",
      fiatValue: "$5,969.83",
      protocol: "Native Segwit",
      address: "n4A9...Zgty",
      ticker: "btc",
    },
  } satisfies AccountItemProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("Main BTC");
    const protocol = canvas.getByTestId("tag");
    const address = canvas.getByText("n4A9...Zgty");
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
      id: "21345",
      cryptoId: "bitcoin",
      name: "Main BTC",
      balance: "0.118 BTC",
      fiatValue: "$5,969.83",
      address: "n4A9...Zgty",
      ticker: "btc",
    },
  } satisfies AccountItemProps,
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
      id: "bitcoin",
      name: "Main BTC",
      balance: "0.118 BTC",
      fiatValue: "$5,969.83",
      address: "n4A9...Zgty",
    },
    showIcon: false,
  } satisfies AccountItemProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const addressIcon = canvas.queryByRole("img");

    await expect(addressIcon).not.toBeInTheDocument();
  },
};

export const TestWithCheckbox: Story = {
  args: {
    onClick: onClick,
    account: {
      address: "n4A9...Zgty",
      balance: "0.118",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
    rightElement: {
      type: "checkbox",
      checkbox: {
        isChecked: false,
        onChange: () => {},
        name: "checkbox",
      },
    },
  } satisfies AccountItemProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const arrowIcon = canvas.getByTestId("right-element-checkbox");

    await expect(arrowIcon).toBeInTheDocument();
  },
};

export const TestWithArrow: Story = {
  args: {
    onClick: onClick,
    account: {
      address: "n4A9...Zgty",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
    rightElement: {
      type: "arrow",
    },
  } satisfies AccountItemProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const arrowIcon = canvas.getByTestId("right-element-arrow-icon");

    await expect(arrowIcon).toBeInTheDocument();
  },
};
