import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import SettingsRow from "../../../components/SettingsRow";
import { NavigatorName, ScreenName } from "../../../const";

export default () => {
  const navigation = useNavigation();
  const handlePress = useCallback(() => {
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.PostOnboardingDebugScreen,
    });
  }, [navigation]);
  return <SettingsRow title="Debug post onboarding" onPress={handlePress} />;
};
