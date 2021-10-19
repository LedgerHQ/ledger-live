import { storiesOf } from "../storiesOf";
import React from "react";
import BedMedium from "@ui/assets/icons/BedMedium";
import AppleMedium from "@ui/assets/icons/AppleMedium";
import HelpRegular from "@ui/assets/icons/HelpRegular";
import DevicesMedium from "@ui/assets/icons/DevicesMedium";

import { View } from "react-native";

const IconSample = () => (
  <View>
    <BedMedium color={"blue"} />
    <AppleMedium color={"blue"} />
    <HelpRegular color={"blue"} />
    <DevicesMedium color={"blue"} />
  </View>
);

storiesOf((story) => story("Icon", module).add("Assets Icons", IconSample));
