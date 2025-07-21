import React from "react";
import { StoryFn } from "@storybook/react";
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

export const Default: StoryFn<typeof NumberedList> = (args: typeof DefaultArgs) => {
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
          description: "Scan QR code until loader hits 100%.",
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
