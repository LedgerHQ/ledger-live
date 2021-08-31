import { storiesOf } from "@storybook/react-native";
import { withKnobs } from "@storybook/addon-knobs";
import React from "react";
import Info from "@ui/icons/Info";
import CenterView from "../CenterView";
import IconBox from "../../../src/components/Icon/IconBox";

storiesOf("Icon", module)
  .addDecorator(withKnobs)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add("IconBox", () => (
    <IconBox Icon={Info} />
  ));
