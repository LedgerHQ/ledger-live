import React, { useMemo } from "react";
import { MainNavigatorTopBarHeader } from "../MainNavigatorTopBarHeader";
import type { ColorPalette } from "@ledgerhq/native-ui";

function getCommonScreenOptions(colors: ColorPalette) {
  return {
    sceneStyle: { backgroundColor: colors.background.main },
    tabBarStyle: [
      {
        height: 300,
        borderTopColor: colors.neutral.c30,
        borderTopWidth: 1,
        elevation: 5,
        shadowColor: colors.neutral.c30,
        backgroundColor: colors.opacityDefault.c10,
      },
    ],
    tabBarShowLabel: false,
    tabBarActiveTintColor: colors.primary.c80,
    tabBarInactiveTintColor: colors.neutral.c70,
    popToTopOnBlur: true,
  };
}

const wallet40ScreenOptions = {
  headerShown: true,
  headerTransparent: true,
  header: () => <MainNavigatorTopBarHeader />,
};

const legacyScreenOptions = {
  headerShown: false,
};

type Params = {
  colors: ColorPalette;
  shouldDisplayWallet40MainNav: boolean;
};

export function useScreenOptions({ colors, shouldDisplayWallet40MainNav }: Params) {
  return useMemo(
    () => ({
      ...getCommonScreenOptions(colors),
      ...(shouldDisplayWallet40MainNav ? wallet40ScreenOptions : legacyScreenOptions),
    }),
    [colors, shouldDisplayWallet40MainNav],
  );
}
