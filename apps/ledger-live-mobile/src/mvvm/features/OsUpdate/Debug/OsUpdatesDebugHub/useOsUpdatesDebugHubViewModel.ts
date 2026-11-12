import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

export function useOsUpdatesDebugHubViewModel() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return {
    onOpenGallery: () => navigation.navigate(ScreenName.DebugOsUpdateGallery),
    onOpenLiveFlow: () => navigation.navigate(ScreenName.DebugOsUpdateOrchestrator),
  };
}

export type OsUpdatesDebugHubViewModel = ReturnType<typeof useOsUpdatesDebugHubViewModel>;
