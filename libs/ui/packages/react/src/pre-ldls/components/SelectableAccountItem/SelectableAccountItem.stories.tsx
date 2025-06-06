import type { Meta, StoryObj } from "@storybook/react";
import { SelectableAccountItemProps, SelectableAccountItem } from "./SelectableAccountItem";
import { expect, within } from "@storybook/test";

export const BASE_SELECTABLE_ACCOUNT_ITEM_PROPS_ARGS = {
  id: "Bitcoin 1",
  checked: true,
  name: "Bitcoin",
  currency: {
    id: "bitcoin",
    ticker: "BTC",
  },
  balance: "0.00",
  address: "0x1234567890",
  onToggle: () => {},
} satisfies SelectableAccountItemProps;

const meta: Meta<typeof SelectableAccountItem> = {
  component: SelectableAccountItem,
  title: "PreLdls/Components/SelectableAccountItem",
  tags: ["autodocs"],
  args: BASE_SELECTABLE_ACCOUNT_ITEM_PROPS_ARGS,
};
export default meta;

type Story = StoryObj<typeof SelectableAccountItem>;

export const Default: Story = {};

export const TestSelectableAccountItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("Bitcoin");

    await expect(name).toBeInTheDocument();
  },
};
