import React from "react";
import { ComponentStory } from "@storybook/react-native";
import { List } from "../../../../src/components";
import { Icons } from "../../../../src/assets";

const description = `
This is a simple bullet list component with fixed layout (text and description), that allows any kind of bullet point.

It's useful for listing a small amount of items, like some tips or a checklist.

It serves as base for the different kind of lists.

This components also accepts various props to style the items (see baseStyled).
`;

export default {
  title: "Layout/List",
  component: List,
  argTypes: {
    alignItems: {
      options: ["flex-start", "flex-end", "center", "baseline", "stretch"],
      control: { type: "select" },
    },
  },
  docs: {
    title: "Default",
    description: {
      component: description,
    },
  },
};

export const Default: ComponentStory<typeof List> = (args: typeof DefaultArgs) => {
  return (
    <List
      items={[
        {
          title: "Enter Word #1...",
          description:
            "Enter the first letters of Word #1 by selecting them with the right or left button. Press both buttons to validate each letter.",
        },
        {
          title: "Validate Word #1...",
          description: "Choose Word #1 from the suggestions. tPress both buttons to validate.",
        },
        {
          title: "Enter Word #1...",
          description: "Repeat for all words!",
        },
      ]}
      itemContainerProps={{
        alignItems: args.alignItems,
      }}
    />
  );
};
Default.storyName = "List";
const DefaultArgs = {
  alignItems: undefined,
};
Default.args = DefaultArgs;

const Check = <Icons.CheckAloneMedium size={20} color={"#6EC85C"} />;
export const Bullets: ComponentStory<typeof List> = (args: typeof BulletArgs) => {
  return (
    <List
      items={[
        {
          title: "Enter Word #1...",
          description:
            "Enter the first letters of Word #1 by selecting them with the right or left button. Press both buttons to validate each letter.",
          bullet: Check,
        },
        {
          title: "Validate Word #1...",
          description: "Choose Word #1 from the suggestions. tPress both buttons to validate.",
          bullet: Check,
        },
        {
          title: "Enter Word #1...",
          description: "Repeat for all words!",
          bullet: Check,
        },
      ]}
      itemContainerProps={{
        alignItems: args.alignItems,
      }}
    />
  );
};
Bullets.storyName = "List (custom bullets)";
const BulletArgs = {
  alignItems: undefined,
};
Bullets.args = BulletArgs;
