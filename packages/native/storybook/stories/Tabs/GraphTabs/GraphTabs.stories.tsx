import { storiesOf } from "../../storiesOf";

import React, { useState } from "react";
import GraphTabs from "../../../../src/components/Tabs/Graph";
import { array } from "@storybook/addon-knobs";

const GraphTabsStory = () => {
  const [activeIndex, changeIndex] = useState(1);

  return (
    <GraphTabs
      activeIndex={activeIndex}
      onChange={changeIndex}
      labels={array(
        "labels",
        new Array(4).fill("").map((_, i) => "Label" + i)
      )}
    />
  );
};

storiesOf((story) => story("Tabs", module).add("Graph", GraphTabsStory));
