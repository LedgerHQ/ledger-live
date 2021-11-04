import React from "react";
import { storiesOf } from "../storiesOf";
import { select, text, number } from "@storybook/addon-knobs";
import Flex from "@components/Layout/Flex";
import Text from "@components/Text";

const FlexStory = () => {
  const alignItems = select(
    "Align items",
    ["flex-start", "flex-end", "center", "baseline", "stretch"],
    "flex-start",
    "Layout"
  );
  const flexDirection = select(
    "Direction",
    ["row", "row-reverse", "column", "column-reverse"],
    "column",
    "Layout"
  );
  const justifyContent = select(
    "Justify Content",
    ["flex-start", "flex-end", "center", "baseline", "stretch"],
    "flex-start",
    "Layout"
  );
  const background = text("Background", "", "Layout");
  const flexBasis = text("FlexBasis", "", "Layout");
  const flexGrow = text("FlexGrow", "", "Layout");
  const flexShrink = text("FlexShrink", "", "Layout");

  const p = number("Padding", 0, {}, "Layout");
  const m = number("Margin", 0, {}, "Layout");

  return (
    <Flex
      alignItems={alignItems}
      background={background}
      flexBasis={flexBasis}
      flexDirection={flexDirection}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
      justifyContent={justifyContent}
      p={p}
      m={m}
    >
      <Text variant="h1">{text("First text", "Lorem ipsum", "Content")}</Text>
      <Text variant="h2">{text("Second text", "dolor sit", "Content")}</Text>
      <Text variant="h3">{text("Third text", "amet", "Content")}</Text>
    </Flex>
  );
};

const FlexStoryTwo = () => {
  const alignItems = select(
    "AlignItems",
    ["flex-start", "flex-end", "center", "baseline", "stretch"],
    "flex-start",
    "Layout"
  );
  const flexDirection = select(
    "FlexDirection",
    ["row", "row-reverse", "column", "column-reverse"],
    "column",
    "Layout"
  );
  const justifyContent = select(
    "JustifyContent",
    ["flex-start", "flex-end", "center", "baseline", "stretch"],
    "flex-start",
    "Layout"
  );
  const background = text("Background", "", "Layout");
  const flexBasis = text("FlexBasis", "", "Layout");
  const flexGrow = text("FlexGrow", "", "Layout");
  const flexShrink = text("FlexShrink", "", "Layout");

  const p = number("Padding", 0, {}, "Layout");
  const m = number("Margin", 0, {}, "Layout");

  return (
    <>
      <Flex
        alignItems={alignItems}
        background={background}
        flexBasis={flexBasis}
        flexDirection={flexDirection}
        flexGrow={flexGrow}
        flexShrink={flexShrink}
        justifyContent={justifyContent}
        p={p}
        m={m}
      >
        <Text variant="h1">{text("First text", "Lorem ipsum", "Content")}</Text>
        <Text variant="h2">{text("Second text", "dolor sit", "Content")}</Text>
        <Text variant="h3">{text("Third text", "amet", "Content")}</Text>
      </Flex>
      <Flex p={4} style={{ borderWidth: 1, borderColor: "red" }}>
        <Text variant="h1">{"I'm not modified"}</Text>
        <Text variant="h2">{"I'm not modified"}</Text>
        <Text variant="h3">{"I'm not modified"}</Text>
      </Flex>
    </>
  );
};

storiesOf((story) =>
  story("Layout", module)
    .add("Flex One", () => <FlexStory />)
    .add("Flex Two", () => <FlexStoryTwo />)
);
