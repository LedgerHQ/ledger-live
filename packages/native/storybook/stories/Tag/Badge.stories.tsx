import React from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import CenterView from "../CenterView";
import Badge from "../../../src/components/tags/Badge";

storiesOf("Tag", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Badge", () => (
    <Badge
      variant={select("type", ["main", "primary", undefined], undefined)}
      active={boolean("active", false)}
    >
      {text("children", "Label")}
    </Badge>
  ));
