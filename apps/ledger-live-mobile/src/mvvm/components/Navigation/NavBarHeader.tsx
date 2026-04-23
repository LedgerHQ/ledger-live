import React, { type ReactNode } from "react";
import { View } from "react-native";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { getHeaderTitle } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExperimental } from "~/experimental";
import {
  NavBar,
  NavBarContent,
  NavBarCoinCapsule,
  NavBarDescription,
  NavBarTitle,
  NavBarTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import type { TextStyle } from "react-native";
import HeaderBackButton from "./HeaderBackButton";
import type {
  LumenNavBarScreenOptions,
  LumenNativeStackNavigationOptions,
  LumenStackNavBarDefaults,
  NavBarDensity,
} from "./lumenNativeStack";

type NavBarHeaderProps = Omit<NativeStackHeaderProps, "options"> & {
  options: LumenNativeStackNavigationOptions;
  density?: NavBarDensity;
  navBarDefaults?: LumenStackNavBarDefaults;
};

const defaultRenderLeading: NonNullable<LumenNativeStackNavigationOptions["headerLeft"]> = () => (
  <HeaderBackButton testID="navigation-header-back-button" />
);

const getNavBarTitleStyle = (density: NavBarDensity): TextStyle => {
  if (density === "expanded") {
    return { textAlign: "left" };
  }
  return { textAlign: "center" };
};

function renderNavBarCenter(title: string, lumen: LumenNavBarScreenOptions | undefined) {
  if (lumen?.renderCenter) {
    return lumen.renderCenter({ title });
  }
  if (lumen?.coinCapsule) {
    return <NavBarCoinCapsule {...lumen.coinCapsule} />;
  }
  const { style: titleStyle, ...titleRest } = lumen?.navBarTitleProps ?? {};
  const { style: descStyle, ...descRest } = lumen?.navBarDescriptionProps ?? {};
  const description = lumen?.description;
  return (
    <>
      <NavBarTitle testID="navigation-header-title" style={titleStyle} {...titleRest}>
        {title}
      </NavBarTitle>
      {description != null && (
        <NavBarDescription style={descStyle} {...descRest}>
          {description}
        </NavBarDescription>
      )}
    </>
  );
}

export default function NavBarHeader({
  options,
  route,
  density: stackDensity = "compact",
  navBarDefaults,
}: NavBarHeaderProps) {
  const insets = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();
  const topPadding = hasExperimentalHeader ? 0 : insets.top;

  const lumen = options.lumenNavBar;
  const HeaderLeft = lumen?.renderLeading ?? options.headerLeft ?? defaultRenderLeading;
  const HeaderRight = lumen?.renderTrailing ?? options.headerRight;
  const effectiveDensity = lumen?.density ?? stackDensity;

  const navBarTitleStyle = getNavBarTitleStyle(effectiveDensity);
  const title = getHeaderTitle(options, route.name);

  const { style: contentStyle, ...navBarContentRest } = lumen?.navBarContentProps ?? {};
  const { style: trailingStyle, ...navBarTrailingRest } = lumen?.navBarTrailingProps ?? {};

  return (
    <View
      style={[
        {
          paddingTop: topPadding,
        },
        options.headerStyle,
      ]}
    >
      <NavBar density={effectiveDensity} {...navBarDefaults?.navBarProps} {...lumen?.navBarProps}>
        {HeaderLeft && (
          <NavBarBackButtonSlot>
            <HeaderLeft />
          </NavBarBackButtonSlot>
        )}
        <NavBarContent style={[navBarTitleStyle, contentStyle]} {...navBarContentRest}>
          {renderNavBarCenter(title, lumen)}
        </NavBarContent>
        {HeaderRight && (
          <NavBarTrailing style={trailingStyle} {...navBarTrailingRest}>
            <HeaderRight />
          </NavBarTrailing>
        )}
      </NavBar>
    </View>
  );
}

function NavBarBackButtonSlot({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
NavBarBackButtonSlot.displayName = "NavBarBackButton";
