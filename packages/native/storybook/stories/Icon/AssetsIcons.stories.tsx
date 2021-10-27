import { View } from "react-native";
import { storiesOf } from "../storiesOf";
import React from "react";
import { Icons } from "../../../src/assets";

const IconSample = () => (
  <View>
    <Icons.BedMedium color={"blue"} />
    <Icons.AppleMedium color={"blue"} />
    <Icons.HelpRegular color={"blue"} />
    <Icons.DevicesMedium color={"blue"} />
  </View>
);

storiesOf((story) => story("Icon", module).add("Assets Icons", IconSample));
