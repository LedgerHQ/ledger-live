import React from "react";
import { number } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import { storiesOf } from "../../storiesOf";
import SlideIndicator from "@components/Navigation/SlideIndicator";

export const SideIndicatorSample = () => (
  <SlideIndicator
    slidesLength={number("slidesLength", 3, { min: 1, max: 7 })}
    activeIndex={number("activeIndex", 0, { min: 0, max: 6 })}
    onChange={action("onChange")}
  />
);

storiesOf((story) =>
  story("Navigation", module).add("SlideIndicator", SideIndicatorSample)
);
