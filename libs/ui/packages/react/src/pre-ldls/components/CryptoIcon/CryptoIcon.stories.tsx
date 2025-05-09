import { type Meta, type StoryObj } from "@storybook/react";
import { CryptoIcon } from "./CryptoIcon";

const meta: Meta<typeof CryptoIcon> = {
  component: CryptoIcon,
  title: "PreLdls/Components/CryptoIcon",
  tags: ["autodocs"],
  args: {
    ledgerId: "bitcoin",
    ticker: "BTC",
    size: "56px",
    network: "",
  },
  argTypes: {
    size: { options: ["16px", "24px", "32px", "40px", "48px", "56px"], control: "select" },
    ledgerId: {
      description: "A chain eg algorand, aptos, bitcoin, cardano, casper",
    },
  },
};
export default meta;

type Story = StoryObj<typeof CryptoIcon>;

export const Default: Story = {
  name: "CryptoIcon",
};
