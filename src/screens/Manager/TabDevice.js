// @flow

import React from "react";
import { View } from "react-native";
import type { State, Action } from "@ledgerhq/live-common/lib/apps/types";
import DeviceCard from './DeviceCard';

type Props = {
  screenProps: {
    state: State,
    dispatch: Action => void,
  },
};

const TabDevice = ({ screenProps: { state } }: Props) => {
  return (
    <DeviceCard deviceModel={state.deviceModel} firmware={state.firmware}/>
  );
};
TabDevice.navigationOptions = {
  title: "DEVICE",
};

export default TabDevice;
