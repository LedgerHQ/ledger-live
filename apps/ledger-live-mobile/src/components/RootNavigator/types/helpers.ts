import {
  MaterialTopTabNavigationProp,
  MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs";
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigationProp,
  ParamListBase,
  RouteProp,
} from "@react-navigation/native";
import { StackNavigationProp, StackScreenProps } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "./BaseNavigator";
import { RootStackParamList } from "./RootNavigator";

export type RootNavigation = StackNavigationProp<RootStackParamList>;
export type BaseNavigation = CompositeNavigationProp<
  StackNavigationProp<BaseNavigatorStackParamList>,
  StackNavigationProp<RootStackParamList>
>;

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

export type MaterialTopTabNavigatorNavigation<
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

export type BaseComposite<
  A extends {
    navigation: NavigationProp<
      ParamListBase,
      string,
      string | undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >;
    route: RouteProp<ParamListBase>;
  },
> = CompositeScreenProps<
  A,
  CompositeScreenProps<
    StackScreenProps<BaseNavigatorStackParamList>,
    StackScreenProps<RootStackParamList>
  >
>;

export type BaseNavigationComposite<
  A extends NavigationProp<
    ParamListBase,
    string,
    string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >,
> = CompositeNavigationProp<
  A,
  CompositeNavigationProp<
    StackNavigationProp<BaseNavigatorStackParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

export type RootComposite<
  A extends {
    navigation: NavigationProp<
      ParamListBase,
      string,
      string | undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >;
    route: RouteProp<ParamListBase>;
  },
> = CompositeScreenProps<A, StackScreenProps<RootStackParamList>>;

export type RootNavigationComposite<
  A extends NavigationProp<
    ParamListBase,
    string,
    string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >,
> = CompositeNavigationProp<A, StackNavigationProp<RootStackParamList>>;

// Represents the header part of the react-navigation options
// Could be expanded to add `headerTitle` and/or `header` if needed one day
export type ReactNavigationHeaderOptions = {
  title?: string;
  headerShown?: boolean;
  headerLeft?: () => React.ReactElement | null;
  headerRight?: () => React.ReactElement | null;
};
