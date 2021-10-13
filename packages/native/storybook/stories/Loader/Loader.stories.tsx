import React from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, number } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import Loader from "@components/Loader";
import CenterView from "../CenterView";
import Icon from "@ui/assets/icons/StarSolidMedium";

storiesOf("Loader", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("default", () => (
    <Loader
      progress={number("progress", 0.2)}
      onPress={action("onPress")}
      Icon={Icon}
    />
  ));
