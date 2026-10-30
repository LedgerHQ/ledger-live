import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFeature } from "@features/platform-feature-flags";
import { NavigatorName, ScreenName } from "~/const";

/** Opens Get Started on "add device" when unified entry points is on, else undefined. */
export function useUnifiedAddDevice(): ((hasDevices: boolean) => void) | undefined {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const deviceOnboarding = useFeature("deviceOnboarding");
  const unifiedEntryPoints = Boolean(
    deviceOnboarding?.enabled && deviceOnboarding.params?.unifiedEntryPoints,
  );

  const openGetStarted = useCallback(
    (hasDevices: boolean) => {
      navigation.navigate(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.Onboarding,
        params: {
          screen: ScreenName.OnboardingPostWelcomeSelection,
          params: { userHasDevice: true, source: hasDevices ? "my_wallet_add" : "my_wallet_empty" },
        },
      });
    },
    [navigation],
  );

  return unifiedEntryPoints ? openGetStarted : undefined;
}
