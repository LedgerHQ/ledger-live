import React from "react";
import { action } from "@storybook/addon-actions";
import ScrollListContainer from "../../../src/components/Layout/ScrollListContainer";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";

export default {
  title: "Layout/ScrollListContainer",
  component: ScrollListContainer,
};

export const ScrollListContainerStory = (args: typeof ScrollListContainerStoryArgs) => (
  <Flex flex={1} width="100%">
    <ScrollListContainer horizontal={args.horizontal} onScroll={action("scroll")}>
      {Array(20)
        .fill(0)
        .map((_, i) => (
          <Flex height="100px" key={i} bg={i % 2 ? "primary.c20" : "neutral.c20"} p={4}>
            <Text variant="body">{i + 1}</Text>
          </Flex>
        ))}
    </ScrollListContainer>
  </Flex>
);
ScrollListContainerStory.storyName = "ScrollListContainer";
const ScrollListContainerStoryArgs = {
  horizontal: false,
};
ScrollListContainerStory.args = ScrollListContainerStoryArgs;
