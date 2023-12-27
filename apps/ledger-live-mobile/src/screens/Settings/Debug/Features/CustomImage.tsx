import React, { useCallback } from "react";
import { FeatureToggle } from "@ledgerhq/live-config/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { NavigatorName, ScreenName } from "~/const";

export default function CustomImage() {
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
    <FeatureToggle featureId="customImage" fallback={null}>
      <SettingsRow
        title="Custom lockscreen"
        desc="Convenient access to the flow"
        iconLeft={<IconsLegacy.LedgerBlueMedium size={32} color="black" />}
        onPress={handlePress}
      />
    </FeatureToggle>
  );
}
