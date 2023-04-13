import React, { useState } from "react";
import ChipTabs from "../../../../src/components/Tabs/Chip";

export default {
  title: "Tabs/Chip",
  component: ChipTabs,
};

export const ChipTabsStory = (args: typeof ChipTabsStoryArgs) => {
  const [activeIndex, changeIndex] = useState(1);

  return (
    <ChipTabs
      activeIndex={activeIndex}
      onChange={changeIndex}
      labels={args.labels}
      disabled={args.disabled}
    />
  );
};
ChipTabsStory.storyName = "ChipTabs";
const ChipTabsStoryArgs = {
  labels: new Array(4).fill("").map((_, i) => "Label" + i),
  disabled: false,
};
ChipTabsStory.args = ChipTabsStoryArgs;
