import React from "react";
import { ComponentStory } from "@storybook/react-native";
import Flex from "../../../src/components/Layout/Flex";
import Text from "../../../src/components/Text";

export default {
  title: "Layout/Flex",
  component: Flex,
  argTypes: {
    alignItems: {
      options: ["flex-start", "flex-end", "center", "baseline", "stretch"],
      control: { type: "select" },
    },
    flexDirection: {
      options: ["row", "row-reverse", "column", "column-reverse"],
      control: { type: "select" },
    },
    justifyContent: {
      options: [
        "flex-start",
        "flex-end",
        "center",
        "space-around",
        "space-between",
        "space-evenly",
        undefined,
      ],
      control: { type: "select" },
    },
  },
};

export const FlexStory: ComponentStory<typeof Flex> = (args: typeof FlexStoryArgs) => {
  const {
    alignItems,
    flexDirection,
    justifyContent,
    background,
    flexBasis,
    flexGrow,
    flexShrink,
    p,
    m,
  } = args;

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
      <Text variant="h1">{args.firstText}</Text>
      <Text variant="h2">{args.secondText}</Text>
      <Text variant="h3">{args.thirdText}</Text>
    </Flex>
  );
};
FlexStory.storyName = "Flex One";
const FlexStoryArgs = {
  alignItems: "flex-start",
  flexDirection: "column" as const,
  justifyContent: "flex-start",
  background: "",
  flexBasis: "auto",
  flexGrow: 1,
  flexShrink: 1,
  p: 0,
  m: 0,
  firstText: "Lorem ipsum",
  secondText: "dolor sit",
  thirdText: "amet",
};
FlexStory.args = FlexStoryArgs;

export const FlexStoryTwo: ComponentStory<typeof Flex> = (args: typeof FlexStoryTwoArgs) => {
  const {
    alignItems,
    flexDirection,
    justifyContent,
    background,
    flexBasis,
    flexGrow,
    flexShrink,
    p,
    m,
  } = args;

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
        <Text variant="h1">{args.firstText}</Text>
        <Text variant="h2">{args.secondText}</Text>
        <Text variant="h3">{args.thirdText}</Text>
      </Flex>
      <Flex p={4} style={{ borderWidth: 1, borderColor: "red" }}>
        <Text variant="h1">{"I'm not modified"}</Text>
        <Text variant="h2">{"I'm not modified"}</Text>
        <Text variant="h3">{"I'm not modified"}</Text>
      </Flex>
    </>
  );
};
FlexStoryTwo.storyName = "Flex Two";
const FlexStoryTwoArgs = {
  alignItems: "flex-start",
  flexDirection: "column" as const,
  justifyContent: "flex-start",
  background: "",
  flexBasis: "auto",
  flexGrow: 1,
  flexShrink: 1,
  p: 0,
  m: 0,
  firstText: "Lorem ipsum",
  secondText: "dolor sit",
  thirdText: "amet",
};
FlexStoryTwo.args = FlexStoryTwoArgs;
