import React from "react";
import { View } from "react-native";
import { IconsLegacy } from "../../../src/assets";
import { Icon } from "../../../src/components/Icon";

export default {
  title: "Icon/Assets",
  component: Icon,
};

export const IconSample = () => (
  <View>
    <IconsLegacy.BedMedium color={"blue"} />
    <IconsLegacy.AppleMedium color={"blue"} />
    <Icon name="Help" weight="Regular" color={"blue"} />
    <Icon name="Devices" color={"blue"} />
  </View>
);
IconSample.storyName = "Assets Icons";
