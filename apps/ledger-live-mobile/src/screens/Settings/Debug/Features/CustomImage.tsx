import React, { useCallback } from "react";
<<<<<<< HEAD
<<<<<<< HEAD
import { FeatureToggle } from "@ledgerhq/live-config/featureFlags/index";
=======
import { FeatureToggle } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
=======
import { FeatureToggle } from "@ledgerhq/live-config/featureFlags/index";
>>>>>>> 5795ae130c (fix: snackcase for folder name)
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "../../../../components/SettingsRow";
import { NavigatorName, ScreenName } from "../../../../const";

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
