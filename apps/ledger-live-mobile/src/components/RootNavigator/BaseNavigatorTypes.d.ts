import { StackNavigationProp } from "@react-navigation/stack";
import { BleDevicePairingFlowParams } from "../../screens/BleDevicePairingFlow/index";

// TODO: types for each screens and navigators need to be set
export type BaseNavigatorStackParamList = {
  BleDevicePairingFlow: BleDevicePairingFlowParams;

  // Hack: allows any other properties
  [otherScreens: string]: undefined | object;
};

export type BaseNavigatorProps =
  StackNavigationProp<BaseNavigatorStackParamList>;
