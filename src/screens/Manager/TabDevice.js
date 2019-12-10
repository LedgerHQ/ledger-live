// @flow

import React from "react";
import { View } from "react-native";
import type { State, Action } from "@ledgerhq/live-common/lib/apps/types";
import LText from "../../components/LText";

type Props = {
  screenProps: {
    state: State,
    dispatch: Action => void,
  },
};

const TabDevice = ({ screenProps: { state } }: Props) => {
  return (
    <View>
      <LText>Wadus tab device</LText>
      <LText>{state.installed.length}</LText>
    </View>
  );
};
TabDevice.navigationOptions = {
  title: "DEVICE",
};

export default TabDevice;
