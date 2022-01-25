import React, { useState } from "react";
import { number } from "@storybook/addon-knobs";
import { storiesOf } from "../../storiesOf";
import SlideIndicator from "../../../../src/components/Navigation/SlideIndicator";

const SideIndicatorSample = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <SlideIndicator
      slidesLength={number("slidesLength", 3, { min: 1 })}
      activeIndex={activeIndex ?? number("activeIndex", 0, { min: 0 })}
      onChange={setActiveIndex}
    />
  );
};

storiesOf((story) => story("Navigation", module).add("SlideIndicator", SideIndicatorSample));
