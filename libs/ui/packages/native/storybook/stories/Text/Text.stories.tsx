import { ComponentStory } from "@storybook/react-native";
import React from "react";
import Text from "../../../src/components/Text";
import { textVariants } from "../../../src/styles/theme";

export default {
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
};

export const Default: ComponentStory<typeof Text> = (args: typeof DefaultArgs) => (
  <Text {...args}>{args.label}</Text>
);
const DefaultArgs = {
  variant: "h1" as const,
  fontWeight: "medium" as const,
  color: "neutral.c100",
  bracket: false,
  label: "Ledger",
};
Default.args = DefaultArgs;
