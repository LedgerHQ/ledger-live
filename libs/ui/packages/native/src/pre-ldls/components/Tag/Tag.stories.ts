import { type Meta, type StoryObj } from "@storybook/react";
import { Tag } from "./Tag";
import { expect } from "@storybook/jest";
import { within } from "@storybook/testing-library";

const meta: Meta<typeof Tag> = {
  component: Tag,
  title: "PreLdls/Components/Tag",
  tags: ["autodocs"],
  args: { children: "Native Segwit", spacing: "sm" },
  argTypes: { spacing: { control: "select", options: ["sm", "md"] } },
};
export default meta;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

export const VariantMd: Story = { args: { spacing: "md" } };

export const TestTag: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("tag");
    await expect(input).toHaveTextContent("Native Segwit");
  },
};
