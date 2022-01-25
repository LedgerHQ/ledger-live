import React from "react";
import { storiesOf } from "../../storiesOf";
import { List } from "../../../../src";
import { Icons } from "../../../../src/assets";
import { select } from "@storybook/addon-knobs";

const description = `
This is a simple bullet list component with fixed layout (text and description), that allows any kind of bullet point.

It's useful for listing a small amount of items, like some tips or a checklist.

It serves as base for the different kind of lists.

This components also accepts various props to style the items (see baseStyled).
`;

const ListStory = () => {
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

const CustomListStory = () => {
  const Check = <Icons.CheckAloneMedium size={20} color={"#6EC85C"} />;
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
        alignItems: select(
          "Align items",
          ["flex-start", "flex-end", "center", "baseline", "stretch"],
          undefined,
          "Layout",
        ),
      }}
    />
  );
};

storiesOf((story) =>
  story("Layout/List", module)
    .add("List", () => <ListStory />, {
      docs: {
        title: "Default",
        description: {
          component: description,
        },
      },
    })
    .add("Custom bullet list", () => <CustomListStory />),
);
