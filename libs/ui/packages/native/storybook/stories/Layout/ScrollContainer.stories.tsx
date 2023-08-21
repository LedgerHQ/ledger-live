import React from "react";
import { ComponentStory } from "@storybook/react-native";
import ScrollContainer from "../../../src/components/Layout/ScrollContainer";
import { action } from "@storybook/addon-actions";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";

export default {
  title: "Layout/Scroll",
  component: ScrollContainer,
};

/*
 ** TODO: use react-native-reanimated hooks to generate onScroll
 ** value once the configuration will be fix to allow using
 ** hooks from our stories
 */
export const Default: ComponentStory<typeof ScrollContainer> = (args: typeof DefaultArgs) => (
  <ScrollContainer width="100%" horizontal={args.horizontal} onScroll={action("scroll")}>
    {Array(20)
      .fill(0)
      .map((_, i) => (
        <Flex height="100px" key={i} bg={i % 2 ? "primary.c20" : "neutral.c20"} p={4}>
          <Text variant="body">{i + 1}</Text>
        </Flex>
      ))}
  </ScrollContainer>
);
Default.storyName = "ScrollContainer";
const DefaultArgs = {
  horizontal: false,
};
Default.args = DefaultArgs;
