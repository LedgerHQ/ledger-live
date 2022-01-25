import { View } from "react-native";
import { storiesOf } from "../storiesOf";
import React from "react";
import { Icons } from "../../../src/assets";
import { Icon } from "../../../src/components/Icon";

const IconSample = () => (
  <View>
    <Icons.BedMedium color={"blue"} />
    <Icons.AppleMedium color={"blue"} />
    <Icon name="Help" weight="Regular" color={"blue"} />
    <Icon name="Devices" color={"blue"} />
  </View>
);

storiesOf((story) => story("Icon", module).add("Assets Icons", IconSample));
