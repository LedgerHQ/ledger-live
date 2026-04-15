import type { ComponentType } from "react";
import type { ParamListBase, StackNavigationState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type {
  NativeStackNavigationEventMap,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import type { LumenNativeStackNavigationOptions } from "./lumenNativeStack";

type LumenNativeStackTypeBag<ParamList extends ParamListBase> = {
  ParamList: ParamList;
  NavigatorID: undefined;
  State: StackNavigationState<ParamList>;
  ScreenOptions: LumenNativeStackNavigationOptions;
  EventMap: NativeStackNavigationEventMap;
  NavigationList: {
    [RouteName in keyof ParamList]: NativeStackNavigationProp<ParamList, RouteName, undefined>;
  };
  Navigator: ComponentType<object>;
};

export function createLumenNativeStackNavigator<const ParamList extends ParamListBase>() {
  return createNativeStackNavigator<ParamList, undefined, LumenNativeStackTypeBag<ParamList>>();
}
