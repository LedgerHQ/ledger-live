import React from "react";
import { storiesOf } from "../storiesOf";
import { text, number } from "@storybook/addon-knobs";
import Box from "../../../src/components/Layout/Box";
import Text from "../../../src/components/Text";

const BoxStory = () => {
  const p = number("Padding", 0, {}, "Layout");
  const m = number("Margin", 0, {}, "Layout");
  const background = text("Background", "", "Layout");

  return (
    <Box background={background} p={p} m={m}>
      <Text variant="h1">{text("First text", "Lorem ipsum", "Content")}</Text>
      <Text variant="h2">{text("Second text", "dolor sit", "Content")}</Text>
      <Text variant="h3">{text("Third text", "amet", "Content")}</Text>
    </Box>
  );
};

const BoxStoryTwo = () => {
  const background = text("Background", "", "Layout");
  const p = number("Padding", 0, {}, "Layout");
  const m = number("Margin", 0, {}, "Layout");

  return (
    <>
      <Box background={background} p={p} m={m}>
        <Text variant="h1">{text("First text", "Lorem ipsum", "Content")}</Text>
        <Text variant="h2">{text("Second text", "dolor sit", "Content")}</Text>
        <Text variant="h3">{text("Third text", "amet", "Content")}</Text>
      </Box>
      <Box p={4} style={{ borderWidth: 1, borderColor: "red" }}>
        <Text variant="h1">{"I'm not modified"}</Text>
        <Text variant="h2">{"I'm not modified"}</Text>
        <Text variant="h3">{"I'm not modified"}</Text>
      </Box>
    </>
  );
};

storiesOf((story) =>
  story("Layout/Box", module)
    .add("Box One", () => <BoxStory />)
    .add("Box Two", () => <BoxStoryTwo />),
);
