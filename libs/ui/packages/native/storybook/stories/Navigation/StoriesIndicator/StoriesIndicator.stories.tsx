import React, { useState } from "react";
import { number } from "@storybook/addon-knobs";
import { storiesOf } from "../../storiesOf";
import StoriesIndicator from "../../../../src/components/Navigation/StoriesIndicator";
import { Box, Button, Text } from "../../../../src";

const StoriesIndicatorSample = () => {
  const [activeIndex, setActiveIndex] = useState<number>(1);

  return (
    <Box>
      <Text textAlign={"center"}>{activeIndex}</Text>
      <StoriesIndicator
        activeIndex={activeIndex}
        slidesLength={4}
        duration={number("duration", 4000)}
      />
      <Button onPress={() => setActiveIndex(activeIndex - 1)}>back</Button>
      <Button onPress={() => setActiveIndex(activeIndex + 1)}>next</Button>
    </Box>
  );
};

storiesOf((story) => story("Navigation", module).add("StoriesIndicator", StoriesIndicatorSample));
