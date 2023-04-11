import React, { useState } from "react";
import { ComponentStory } from "@storybook/react-native";
import StoriesIndicator from "../../../../src/components/Navigation/StoriesIndicator";
import { Box, Button, Text } from "../../../../src/components";

export default {
  title: "Navigation/StoriesIndicator",
  component: StoriesIndicator,
};

export const StoriesIndicatorSample: ComponentStory<typeof StoriesIndicator> = (
  args: typeof StoriesIndicatorSampleArgs,
) => {
  const [activeIndex, setActiveIndex] = useState<number>(1);

  return (
    <Box>
      <Text textAlign={"center"}>{activeIndex}</Text>
      <StoriesIndicator activeIndex={activeIndex} slidesLength={4} duration={args.duration} />
      <Button onPress={() => setActiveIndex(activeIndex - 1)}>back</Button>
      <Button onPress={() => setActiveIndex(activeIndex + 1)}>next</Button>
    </Box>
  );
};
StoriesIndicatorSample.storyName = "StoriesIndicator";
const StoriesIndicatorSampleArgs = {
  duration: 4000,
};
StoriesIndicatorSample.args = StoriesIndicatorSampleArgs;
