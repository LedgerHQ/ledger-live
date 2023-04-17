import React from "react";
import { ComponentStory } from "@storybook/react-native";
import { TipList } from "../../../../src/components";

export default {
  title: "Layout/List/Tip",
  component: TipList,
  argTypes: {
    alignItems: {
      options: ["flex-start", "flex-end", "center", "baseline", "stretch"],
      control: { type: "select" },
    },
  },
};

export const Default: ComponentStory<typeof TipList> = (args: typeof DefaultArgs) => {
  return (
    <TipList
      items={[
        {
          title: "Always choose a PIN code by yourself.",
          isPositive: true,
        },
        {
          title: "Always enter your PIN code without being observed.",
          isPositive: true,
        },
        {
          title: "You can change your PIN code if needed. ",
          isPositive: true,
        },
        {
          title: "Never use an easy PIN code like 0000, 123456, or 55555555.",
          isPositive: false,
        },
        {
          title: "Never share your PIN code with someone else.",
          isPositive: false,
        },
        {
          title: "Never use a PIN code you did not choose by yourself.",
          isPositive: false,
        },
      ]}
      itemContainerProps={{
        alignItems: args.alignItems,
      }}
    />
  );
};
Default.storyName = "TipList";
const DefaultArgs = {
  alignItems: "center",
};
Default.args = DefaultArgs;
