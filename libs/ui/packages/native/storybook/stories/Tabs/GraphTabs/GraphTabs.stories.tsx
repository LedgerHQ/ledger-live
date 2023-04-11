import React, { useState } from "react";
import GraphTabs from "../../../../src/components/Tabs/Graph";

export default {
  title: "Tabs/Graph",
  component: GraphTabs,
  argTypes: {
    activeBg: {
      options: [
        "primary.c20",
        "primary.c100",
        "neutral.c20",
        "success.c50",
        "neutral.c30",
        undefined,
      ],
      control: { type: "select" },
    },
    activeColor: {
      options: [
        "primary.c20",
        "primary.c100",
        "neutral.c100",
        "neutral.c00",
        "success.c50",
        undefined,
      ],
      control: { type: "select" },
    },
    size: {
      options: ["medium", "small"],
      control: { type: "select" },
    },
  },
};

export const GraphTabsStory = (args: typeof GraphTabsStoryArgs) => {
  const [activeIndex, changeIndex] = useState(1);

  return <GraphTabs activeIndex={activeIndex} onChange={changeIndex} {...args} />;
};
GraphTabsStory.storyName = "GraphTabs";
const GraphTabsStoryArgs = {
  labels: new Array(4).fill("").map((_, i) => "Label" + i),
  activeBg: "primary.c20",
  activeColor: "neutral.c100",
  size: "medium" as const,
  disabled: false,
};
GraphTabsStory.args = GraphTabsStoryArgs;
