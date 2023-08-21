import React from "react";
import { ComponentStory } from "@storybook/react-native";
import { NumberedList } from "../../../../src/components";

export default {
  title: "Layout/List/Numbered",
  component: NumberedList,
  argTypes: {
    alignItems: {
      options: ["flex-start", "flex-end", "center", "baseline", "stretch"],
      control: { type: "select" },
    },
  },
};

export const Default: ComponentStory<typeof NumberedList> = (args: typeof DefaultArgs) => {
  return (
    <NumberedList
      items={[
        {
          description: "Get a new hardware wallet.",
        },
        {
          description: "Select “Restore recovery phrase on a new device” on the Ledger app.",
          number: 42,
        },
        {
          description:
            "Enter your recovery phrase on your new device to restore access to your crypto.",
        },
      ]}
      itemContainerProps={{ alignItems: args.alignItems }}
    />
  );
};
Default.storyName = "NumberedList";
const DefaultArgs = {
  alignItems: "center",
};
Default.args = DefaultArgs;
