import { storiesOf } from "../../storiesOf";

import React, { useState } from "react";
import GraphTabs from "../../../../src/components/Tabs/Graph";
import { array, select, boolean } from "@storybook/addon-knobs";

const GraphTabsStory = () => {
  const [activeIndex, changeIndex] = useState(1);

  return (
    <GraphTabs
      activeIndex={activeIndex}
      onChange={changeIndex}
      labels={array(
        "labels",
        new Array(4).fill("").map((_, i) => "Label" + i),
      )}
      activeBg={select(
        "activeBg",
        ["primary.c20", "primary.c100", "neutral.c20", "success.c50", "neutral.c30", undefined],
        "primary.c20",
      )}
      activeColor={select(
        "activeColor",
        ["primary.c20", "primary.c100", "neutral.c100", "neutral.c00", "success.c50", undefined],
        "neutral.c100",
      )}
      size={select("size", ["medium", "small"], "medium")}
      disabled={boolean("disabled", false)}
    />
  );
};

storiesOf((story) => story("Tabs", module).add("Graph", GraphTabsStory));
