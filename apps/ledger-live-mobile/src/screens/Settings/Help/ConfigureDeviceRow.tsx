import React from "react";
import { Trans } from "react-i18next";
import { CompositeScreenProps, useNavigation } from "@react-navigation/native";
import { ScreenName, NavigatorName } from "~/const";
import SettingsRow from "~/components/SettingsRow";
import { useNavigationInterceptor } from "../../Onboarding/onboardingContext";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";

type Navigation = CompositeScreenProps<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.HelpSettings>,
  StackNavigatorProps<RootStackParamList>
>;

export default function ConfigureDeviceRow() {
  const { navigate } = useNavigation<Navigation["navigation"]>();
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();

  function onPress() {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
    navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
  }

  return (
    <SettingsRow
      event="ConfigureDeviceRow"
      title={<Trans i18nKey="settings.help.configureDevice" />}
      desc={<Trans i18nKey="settings.help.configureDeviceDesc" />}
      arrowRight
      onPress={onPress}
    />
  );
}
