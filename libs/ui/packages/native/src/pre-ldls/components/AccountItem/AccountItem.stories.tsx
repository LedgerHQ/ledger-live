import type { Meta, StoryObj } from "@storybook/react";
import { AccountItem } from "./AccountItem";

const onClick = () => console.log("Account clicked");

const meta: Meta<typeof AccountItem> = {
  component: AccountItem,
  title: "PreLdls/Components/AccountItem",
  tags: ["autodocs"],
  args: {
    onClick: onClick,
    account: {
      address: "n4A9...Zgty",
      balance: "0.118 ETH",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "AccountItem displays an account with its name, address, balance, and fiat value. Use it to represent selectable accounts in lists.",
      },
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
      address: "n4A9...Zgty",
      balance: "0.118 BTC",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      protocol: "Native Segwit",
      ticker: "btc",
    },
  },
};

export const TestWithoutProtocol: Story = {
  args: {
    onClick: onClick,
    account: {
      address: "n4A9...Zgty",
      balance: "0.118 BTC",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "21345",
      name: "Main BTC",
      ticker: "btc",
    },
  },
};

export const TestWithoutAddressIcon: Story = {
  args: {
    onClick: onClick,
    account: {
      address: "n4A9...Zgty",
      balance: "0.118 BTC",
      fiatValue: "$5,969.83",
      id: "bitcoin",
      name: "Main BTC",
    },
    showIcon: false,
  },
};

export const TestWithCheckbox: Story = {
  args: {
    account: {
      address: "n4A9...Zgty",
      balance: "0.118",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
    onClick: onClick,
    rightElement: {
      type: "checkbox",
      checkbox: {
        checked: false,
        onChange: () => {},
      },
    },
  },
};

export const TestWithArrow: Story = {
  args: {
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
  },
};

export const TestWithEdit: Story = {
  args: {
    account: {
      address: "n4A9...Zgty",
      cryptoId: "bitcoin",
      fiatValue: "$5,969.83",
      id: "12345",
      name: "Main BTC",
      ticker: "btc",
    },
    onClick: undefined,
    rightElement: {
      type: "edit",
      onClick: onClick,
    },
  },
};
