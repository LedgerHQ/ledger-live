import React, { useCallback } from "react";
<<<<<<< HEAD
import { FeatureToggle } from "@ledgerhq/live-config/featureFlags/index";
=======
import { FeatureToggle } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "../../../../components/SettingsRow";
import { NavigatorName, ScreenName } from "../../../../const";

export default function ClaimNftFlowDebug() {
  const navigation = useNavigation();
  const handlePress = useCallback(() => {
    navigation.navigate(NavigatorName.ClaimNft, {
      screen: ScreenName.ClaimNftWelcome,
    });
  }, [navigation]);

  return (
    <FeatureToggle featureId="postOnboardingClaimNft" fallback={null}>
      <SettingsRow
        title="Claim NFT flow"
        desc="Convenient access to the flow"
        iconLeft={<IconsLegacy.ImportMedium size={32} color="black" />}
        onPress={handlePress}
      />
    </FeatureToggle>
  );
}
