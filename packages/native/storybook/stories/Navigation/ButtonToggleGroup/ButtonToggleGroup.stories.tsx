import { storiesOf } from "../../storiesOf";

import React, { useState } from "react";
import ButtonToggleGroup from "../../../../src/components/Navigation/ToggleGroup/ButtonToggleGroup";
import { array } from "@storybook/addon-knobs";

const ButtonToggleGroupStory = () => {
  const [activeIndex, changeIndex] = useState(1);

  return (
    <ButtonToggleGroup
      activeIndex={activeIndex}
      onChange={changeIndex}
      labels={array('labels', new Array(4).fill("").map((_, i) => "Label" + i))}
    />
  );
};

storiesOf((story) =>
  story("Navigation", module).add("ButtonToggleGroup", ButtonToggleGroupStory)
);
