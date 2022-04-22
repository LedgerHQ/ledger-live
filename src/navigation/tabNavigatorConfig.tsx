import { ColorPalette } from "@ledgerhq/native-ui";

export const getLineTabNavigatorConfig = (colors: ColorPalette) => ({
  screenOptions: {
    tabBarActiveTintColor: colors.neutral.c100,
    tabBarInactiveTintColor: colors.neutral.c80,
    tabBarIndicatorStyle: {
      backgroundColor: colors.primary.c70,
      height: 3,
    },
    tabBarStyle: {
      backgroundColor: colors.background.main,
      borderBottomWidth: 1,
      borderColor: colors.neutral.c40,
    },
  },
  sceneContainerStyle: {
    backgroundColor: colors.background.main,
  },
});
