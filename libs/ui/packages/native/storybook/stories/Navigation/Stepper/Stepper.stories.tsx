import { storiesOf } from "../../storiesOf";
import { number, array, boolean } from "@storybook/addon-knobs";
import React from "react";
import Stepper from "../../../../src/components/Navigation/Stepper";

storiesOf((story) =>
  story("Navigation", module).add("Stepper", () => (
    <Stepper
      steps={array("steps", ["First step", "Second step", "Third step", "Fourth step"])}
      activeIndex={number("activeIndex", 0, { min: 0, max: 6 })}
      errored={boolean("errored", false)}
    />
  )),
);
