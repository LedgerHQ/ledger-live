import type { ReactNode } from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import type {
  NavBarAppearance,
  NavBarCoinCapsuleProps,
  NavBarContentProps,
  NavBarDescriptionProps,
  NavBarProps,
  NavBarTitleProps,
  NavBarTrailingProps,
} from "@ledgerhq/lumen-ui-rnative";

export type LumenNavBarScreenOptions = {
  appearance?: NavBarAppearance;
  navBarProps?: Omit<NavBarProps, "appearance" | "children">;
  navBarContentProps?: Omit<NavBarContentProps, "children">;
  navBarTitleProps?: Omit<NavBarTitleProps, "children">;
  navBarDescriptionProps?: Omit<NavBarDescriptionProps, "children">;
  navBarTrailingProps?: Omit<NavBarTrailingProps, "children">;
  description?: ReactNode;
  coinCapsule?: NavBarCoinCapsuleProps;
  renderCenter?: (params: { title: string }) => ReactNode;
  renderLeading?: NativeStackNavigationOptions["headerLeft"];
  renderTrailing?: NativeStackNavigationOptions["headerRight"];
};

export type LumenStackNavBarDefaults = {
  navBarProps?: Omit<NavBarProps, "appearance" | "children">;
};

export type LumenNativeStackNavigationOptions = NativeStackNavigationOptions & {
  lumenNavBar?: LumenNavBarScreenOptions;
};
