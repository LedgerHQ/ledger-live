import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import React from "react";
import { BASE_SELECTABLE_ACCOUNT_ITEM_PROPS_ARGS } from "../SelectableAccountItem/SelectableAccountItem.stories";
import { SelectableAccountList } from "./SelectableAccountList";

const testFn = fn();

const meta: Meta<typeof SelectableAccountList> = {
  component: SelectableAccountList,
  decorators: [
    Story => (
      <div style={{ height: "400px" }}>
        <Story />
      </div>
    ),
  ],
  title: "PreLdls/Components/SelectableAccountList",
  tags: ["autodocs"],
  args: {
    accounts: Array.from({ length: 50 }, (_, i) => ({
      ...BASE_SELECTABLE_ACCOUNT_ITEM_PROPS_ARGS,
      id: i.toString(),
    })),
  },
};
export default meta;

type Story = StoryObj<typeof SelectableAccountList>;

export const Default: Story = {};

export const TestSelectableAccountClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByText("Bitcoin 1");
    await userEvent.click(input);
    await expect(testFn).toHaveBeenCalledWith("bitcoin");
  },
};
