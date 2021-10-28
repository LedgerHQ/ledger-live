import { storiesOf } from "../storiesOf";

import React, { useState } from "react";
import ToggleGroup from "../../../src/components/Navigation/ToggleGroup";

const ToggleGroupStory = () => {
  const [activeIndex, changeIndex] = useState(1);

  return (
    <ToggleGroup
      activeIndex={activeIndex}
      onChange={changeIndex}
      labels={new Array(6).fill("").map((_, i) => "Label" + i)}
    />
  );
};

storiesOf((story) =>
  story("Navigation", module).add("ToggleGroup", () => <ToggleGroupStory />)
);
