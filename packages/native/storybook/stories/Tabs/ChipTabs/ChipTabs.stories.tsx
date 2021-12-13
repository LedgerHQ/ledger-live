import { storiesOf } from "../../storiesOf";
import { array } from "@storybook/addon-knobs";

import React, { useState } from "react";
import ChipTabs from "../../../../src/components/Tabs/Chip";

const ChipTabsStory = () => {
  const [activeIndex, changeIndex] = useState(1);

  return (
    <ChipTabs
      activeIndex={activeIndex}
      onChange={changeIndex}
      labels={array(
        "labels",
        new Array(4).fill("").map((_, i) => "Label" + i)
      )}
    />
  );
};

storiesOf((story) => story("Tabs", module).add("Chip", ChipTabsStory));
