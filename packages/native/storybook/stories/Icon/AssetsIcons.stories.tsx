import { storiesOf } from "@storybook/react-native";
import { withKnobs } from "@storybook/addon-knobs";
import React from "react";
import BedMedium from "@ui/assets/icons/BedMedium";
import AppleMedium from "@ui/assets/icons/AppleMedium";
import HelpRegular from "@ui/assets/icons/HelpRegular";
import DevicesMedium from "@ui/assets/icons/DevicesMedium";

import CenterView from "../CenterView";
import {View} from "react-native";

storiesOf("Icon", module)
  .addDecorator(withKnobs)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add("Assets icons", () => (
    <View><BedMedium color={'blue'} /><AppleMedium color={'blue'}  /><HelpRegular  color={'blue'}  /><DevicesMedium color={'blue'}  /></View>
  ));
