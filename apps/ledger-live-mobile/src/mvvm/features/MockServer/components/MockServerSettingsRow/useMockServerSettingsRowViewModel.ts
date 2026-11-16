import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { ScreenName } from "~/const";
import { isMockServerEnabledSelector } from "~/reducers/settings";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

export type MockServerSettingsRowViewModel = {
  isEnabled: boolean;
  onPress: () => void;
};

export function useMockServerSettingsRowViewModel(): MockServerSettingsRowViewModel {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const isEnabled = useSelector(isMockServerEnabledSelector);

  const onPress = useCallback(() => navigation.navigate(ScreenName.DebugMockServer), [navigation]);

  return { isEnabled, onPress };
}
