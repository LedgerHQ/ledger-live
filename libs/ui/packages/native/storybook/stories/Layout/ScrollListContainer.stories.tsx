import React from "react";
import { action } from "@storybook/addon-actions";
import { boolean } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import ScrollListContainer from "../../../src/components/Layout/ScrollListContainer";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";

const ScrollListContainerStory = () => (
  <Flex flex={1} width="100%">
    <ScrollListContainer horizontal={boolean("Horizontal", false)} onScroll={action("scroll")}>
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

storiesOf((story) => story("Layout", module).add("ScrollListContainer", ScrollListContainerStory));
