import type { Meta, StoryObj } from "@storybook/react";
import Text from "../../../src/components/Text";
import { textVariants } from "../../../src/styles/theme";

const meta = {
  title: "Text",
  component: Text,
  argTypes: {
    variant: {
      options: textVariants,
      control: { type: "select" },
    },
    fontWeight: {
      options: ["medium", "semiBold", "bold"],
      control: { type: "select" },
    },
    color: {
      options: ["primary.c100", "neutral.c100"],
      control: { type: "select" },
    },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "h1",
    fontWeight: "medium",
    color: "neutral.c100",
    bracket: false,
    children: "Ledger",
  },
};
