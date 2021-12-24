import React from "react";
import { storiesOf } from "../../storiesOf";
import { IconBoxList } from "../../../../src";
import { Icons } from "../../../../src/assets";
import { select } from "@storybook/addon-knobs";

const IconBoxListStory = () => {
  return (
    <IconBoxList
      items={[
        {
          title: "Enter Word #1...",
          description:
            "Enter the first letters of Word #1 by selecting them with the right or left button. Press both buttons to validate each letter.",
          Icon: Icons.ClockMedium,
        },
        {
          title: "Validate Word #1...",
          description: "Choose Word #1 from the suggestions. tPress both buttons to validate.",
          Icon: Icons.EyeNoneMedium,
        },
        {
          title: "Enter Word #1...",
          description: "Repeat for all words!",
          Icon: Icons.TrophyMedium,
        },
      ]}
      itemContainerProps={{
        alignItems: select(
          "Align items",
          ["flex-start", "flex-end", "center", "baseline", "stretch"],
          "center",
          "Layout",
        ),
      }}
    />
  );
};

storiesOf((story) => story("Layout/List", module).add("IconBoxList", () => <IconBoxListStory />));
