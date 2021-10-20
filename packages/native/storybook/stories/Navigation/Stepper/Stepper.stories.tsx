import { storiesOf } from "@storybook/react-native";
import { withKnobs, number, array, boolean } from "@storybook/addon-knobs";
import React from "react";
import Stepper from "@components/Navigation/Stepper";
import CenterView from "../../CenterView";

storiesOf("Navigation", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Stepper", () => (
    <Stepper
      steps={array("steps", [
        "First step",
        "Second step",
        "Third step",
        "Fourth step",
      ])}
      activeIndex={number("activeIndex", 0, { min: 0, max: 6 })}
      errored={boolean("errored", false)}
    />
  ));
