import { storiesOf } from "../../storiesOf";
import { array } from "@storybook/addon-knobs";

import React, { useState } from "react";
import NavigationToggleGroup from "../../../../src/components/Navigation/ToggleGroup/NavigationToggleGroup";

const NavigationToggleGroupStory = () => {
  const [activeIndex, changeIndex] = useState(1);

  return (
    <NavigationToggleGroup
      activeIndex={activeIndex}
      onChange={changeIndex}
      labels={array('labels', new Array(4).fill("").map((_, i) => "Label" + i))}
    />
  );
};

storiesOf((story) =>
  story("Navigation", module).add("NavigationToggleGroup", NavigationToggleGroupStory)
);
