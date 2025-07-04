import React from "react";
import { StoryFn } from "@storybook/react";
import { IconBoxList } from "../../../../src/components";
import { IconsLegacy } from "../../../../src/assets";

export default {
  title: "Layout/List/IconBox",
  component: IconBoxList,
  argTypes: {
    alignItems: {
      options: ["flex-start", "flex-end", "center", "baseline", "stretch"],
      control: { type: "select" },
    },
  },
};

export const Default: StoryFn<typeof IconBoxList> = (args: typeof DefaultArgs) => {
  return (
    <IconBoxList
      items={[
        {
          title: "Enter Word #1...",
          description:
            "Enter the first letters of Word #1 by selecting them with the right or left button. Press both buttons to validate each letter.",
          Icon: IconsLegacy.ClockMedium,
        },
        {
          title: "Validate Word #1...",
          description: "Choose Word #1 from the suggestions. tPress both buttons to validate.",
          Icon: IconsLegacy.EyeNoneMedium,
        },
        {
          title: "Enter Word #1...",
          description: "Repeat for all words!",
          Icon: IconsLegacy.TrophyMedium,
        },
      ]}
      itemContainerProps={{ alignItems: args.alignItems }}
    />
  );
};
Default.storyName = "IconBoxList";
const DefaultArgs = {
  alignItems: "center",
};
Default.args = DefaultArgs;
