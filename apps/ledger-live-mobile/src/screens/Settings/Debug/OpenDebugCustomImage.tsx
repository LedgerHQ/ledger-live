import React, { useCallback } from "react";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import SettingsRow from "../../../components/SettingsRow";
import { NavigatorName, ScreenName } from "../../../const";

export default function OpenDebugCustomImage() {
  const navigation = useNavigation();
  const handlePress = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep0Welcome,
      params: {
        device: null,
      },
    });
  }, [navigation]);

  return (
    <FeatureToggle feature="customImage" fallback={null}>
      <SettingsRow title="Debug Custom Image" onPress={handlePress} />
    </FeatureToggle>
  );
}
