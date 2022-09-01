import {
  MaterialTopTabNavigationProp,
  MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp, StackScreenProps } from "@react-navigation/stack";

export type StackNavigatorProps<
  ParamList extends ParamListBase,
  RouteName = never,
> = StackScreenProps<
  ParamList,
  RouteName extends never
    ? keyof ParamList
    : RouteName extends keyof ParamList
    ? RouteName
    : never
>;

export type StackNavigatorNavigation<
  ParamList extends ParamListBase,
  RouteName = never,
> = StackNavigationProp<
  ParamList,
  RouteName extends never
    ? keyof ParamList
    : RouteName extends keyof ParamList
    ? RouteName
    : never
>;
export type StackNavigatorRoute<
  ParamList extends ParamListBase,
  RouteName = never,
> = StackNavigatorProps<ParamList, RouteName>["route"];

export type MaterialTopTabNavigatorProps<
  ParamList extends ParamListBase,
  RouteName = never,
> = MaterialTopTabScreenProps<
  ParamList,
  RouteName extends never
    ? keyof ParamList
    : RouteName extends keyof ParamList
    ? RouteName
    : never
>;

export type MaterialTopTabkNavigatorNavigation<
  ParamList extends ParamListBase,
  RouteName = never,
> = MaterialTopTabNavigationProp<
  ParamList,
  RouteName extends never
    ? keyof ParamList
    : RouteName extends keyof ParamList
    ? RouteName
    : never
>;
export type MaterialTopTabNavigatorRoute<
  ParamList extends ParamListBase,
  RouteName = never,
> = MaterialTopTabNavigatorProps<ParamList, RouteName>["route"];
