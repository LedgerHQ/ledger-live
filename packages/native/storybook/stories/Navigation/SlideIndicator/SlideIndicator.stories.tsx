import { storiesOf } from "@storybook/react-native";
import { withKnobs, number } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import SlideIndicator from "@components/Navigation/SlideIndicator";
import CenterView from "../../CenterView";

storiesOf("Navigation", module)
  .addDecorator(withKnobs)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add("SlideIndicator", () => (
    <SlideIndicator
      slidesLength={number("slidesLength", 3, { min: 1, max: 7 })}
      activeIndex={number("activeIndex", 0, { min: 0, max: 6 })}
      onChange={action("onChange")}
    />
  ));
