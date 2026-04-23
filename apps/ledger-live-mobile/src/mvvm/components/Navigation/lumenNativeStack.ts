import type { ReactNode } from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import type {
  NavBarCoinCapsuleProps,
  NavBarContentProps,
  NavBarDescriptionProps,
  NavBarProps,
  NavBarTitleProps,
  NavBarTrailingProps,
} from "@ledgerhq/lumen-ui-rnative";

export type NavBarDensity = NavBarProps["density"];

export type LumenNavBarScreenOptions = {
  density?: NavBarDensity;
  navBarProps?: Omit<NavBarProps, "density" | "children">;
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
  navBarProps?: Omit<NavBarProps, "density" | "children">;
};

export type LumenNativeStackNavigationOptions = NativeStackNavigationOptions & {
  lumenNavBar?: LumenNavBarScreenOptions;
};
