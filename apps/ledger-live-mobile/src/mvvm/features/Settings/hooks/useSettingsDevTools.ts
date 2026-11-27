import { useMemo } from "react";
import Config from "react-native-config";
import type { SettingsHomeDevTools } from "@features/flow-settings/native";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { isDebugMenuVisible } from "~/reducers/appstate";

type SettingsNavigation = StackNavigatorNavigation<
  SettingsNavigatorStackParamList,
  ScreenName.SettingsScreen
>;

/** Developer and Debug rows of the Settings home: both in dev builds or once unlocked from About. */
export function useSettingsDevTools(navigation: SettingsNavigation): SettingsHomeDevTools {
  const isDebugUnlocked = useSelector(isDebugMenuVisible);
  const isDevToolsVisible = __DEV__ || isDebugUnlocked || Boolean(Config.FORCE_DEBUG_VISIBLE);

  return useMemo(
    () => ({
      onOpenDeveloper: isDevToolsVisible
        ? () => navigation.navigate(ScreenName.DeveloperSettings)
        : undefined,
      onOpenDebug: isDevToolsVisible
        ? () => navigation.navigate(ScreenName.DebugSettings)
        : undefined,
    }),
    [navigation, isDevToolsVisible],
  );
}
