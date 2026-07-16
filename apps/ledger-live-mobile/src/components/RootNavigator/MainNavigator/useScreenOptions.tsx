import React, { useMemo } from "react";
import type { ColorPalette } from "@ledgerhq/native-ui";
import { MainNavigatorTopBarHeader } from "../MainNavigatorTopBarHeader";

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

type Params = {
  colors: ColorPalette;
};

export function useScreenOptions({ colors }: Params) {
  return useMemo(
    () => ({
      ...getCommonScreenOptions(colors),
      ...wallet40ScreenOptions,
    }),
    [colors],
  );
}
