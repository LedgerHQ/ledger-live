import React from "react";
import { ComponentStory } from "@storybook/react-native";
import Box from "../../../src/components/Layout/Box";
import Text from "../../../src/components/Text";

export default {
  title: "Layout/Box",
  component: Box,
};

export const BoxStory: ComponentStory<typeof Box> = (args: typeof BoxStoryArgs) => {
  const { p, m, background } = args;

  return (
    <Box background={background} p={p} m={m}>
      <Text variant="h1">{args.firstText}</Text>
      <Text variant="h2">{args.secondText}</Text>
      <Text variant="h3">{args.thirdText}</Text>
    </Box>
  );
};
BoxStory.storyName = "Box One";
const BoxStoryArgs = {
  p: 0,
  m: 0,
  background: "",
  firstText: "Lorem ipsum",
  secondText: "dolor sit",
  thirdText: "amet",
};
BoxStory.args = BoxStoryArgs;

export const BoxStoryTwo: ComponentStory<typeof Box> = (args: typeof BoxStoryTwoArgs) => {
  const { p, m, background } = args;

  return (
    <>
      <Box background={background} p={p} m={m}>
        <Text variant="h1">{args.firstText}</Text>
        <Text variant="h2">{args.secondText}</Text>
        <Text variant="h3">{args.thirdText}</Text>
      </Box>
      <Box p={4} style={{ borderWidth: 1, borderColor: "red" }}>
        <Text variant="h1">{"I'm not modified"}</Text>
        <Text variant="h2">{"I'm not modified"}</Text>
        <Text variant="h3">{"I'm not modified"}</Text>
      </Box>
    </>
  );
};
BoxStoryTwo.storyName = "Box Two";
const BoxStoryTwoArgs = {
  p: 0,
  m: 0,
  background: "",
  firstText: "Lorem ipsum",
  secondText: "dolor sit",
  thirdText: "amet",
};
BoxStoryTwo.args = BoxStoryTwoArgs;
