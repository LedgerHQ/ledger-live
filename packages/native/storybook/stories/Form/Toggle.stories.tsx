import { text } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Toggle from "@components/Form/Toggle";
import CenterView from "../CenterView";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

storiesOf("Toggle", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("regular", () => (
    <Toggle
      active={boolean("active", false)}
      onPress={action("onPress")}
    >
      {text("label", "Toggle")}
    </Toggle>
  ))
