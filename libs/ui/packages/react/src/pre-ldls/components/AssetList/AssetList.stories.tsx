import type { Meta, StoryObj } from "@storybook/react";
import { AssetList } from "./AssetList";
import { PlayFnProps } from "src/pre-ldls/types";
import { expect, fn, userEvent, within } from "@storybook/test";

const testFn = fn();

const meta: Meta<typeof AssetList> = {
  component: AssetList,
  title: "PreLdls/Components/AssetList",
  tags: ["autodocs"],
  args: {
    assets: Array.from({ length: 50 }).map((_, i) => ({ name: `Bitcoin ${i}`, ticker: "BTC" })),
    onClick: testFn,
  },
};
export default meta;

type Story = StoryObj<typeof AssetList>;

export const Default: Story = {};

export const TestAssetClick: Story = {
  play: async ({ canvasElement }: PlayFnProps) => {
    const canvas = within(canvasElement);
    const input = canvas.getByText("Bitcoin 1");
    await userEvent.click(input);
    await expect(testFn).toHaveBeenCalledWith({ name: "Bitcoin 1", ticker: "BTC" });
  },
};
