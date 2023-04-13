import React from "react";
import { View } from "react-native";
import { Icons } from "../../../src/assets";
import { Icon } from "../../../src/components/Icon";

export default {
  title: "Icon/Assets",
  component: Icon,
};

export const IconSample = () => (
  <View>
    <Icons.BedMedium color={"blue"} />
    <Icons.AppleMedium color={"blue"} />
    <Icon name="Help" weight="Regular" color={"blue"} />
    <Icon name="Devices" color={"blue"} />
  </View>
);
IconSample.storyName = "Assets Icons";
