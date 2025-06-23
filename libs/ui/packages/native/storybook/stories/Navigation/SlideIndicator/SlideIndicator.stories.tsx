import React, { useState } from "react";
import { StoryFn } from "@storybook/react";
import SlideIndicator from "../../../../src/components/Navigation/SlideIndicator";

export default {
  title: "Navigation/SlideIndicator",
  component: SlideIndicator,
};

export const SlideIndicatorSample: StoryFn<typeof SlideIndicator> = (
  args: typeof SlideIndicatorSampleArgs,
) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <SlideIndicator
      slidesLength={args.slidesLength}
      activeIndex={activeIndex ?? args.activeIndex}
      onChange={setActiveIndex}
    />
  );
};
SlideIndicatorSample.storyName = "SlideIndicator";
const SlideIndicatorSampleArgs = {
  slidesLength: 3,
  activeIndex: 0,
};
SlideIndicatorSample.args = SlideIndicatorSampleArgs;
