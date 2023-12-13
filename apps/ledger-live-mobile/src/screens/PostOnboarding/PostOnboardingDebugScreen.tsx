import { DeviceModelId } from "@ledgerhq/devices/index";
import { Flex } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingEntryPointCard from "~/components/PostOnboarding/PostOnboardingEntryPointCard";
import SettingsRow from "~/components/SettingsRow";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import { NavigatorName } from "~/const";

export default () => {
  const navigation = useNavigation();
  const startPostOnboarding = useStartPostOnboardingCallback();

  const handleInitPostOnboardingHub = useCallback(
    (deviceId: DeviceModelId, mock: boolean) =>
      startPostOnboarding({
        deviceModelId: deviceId,
        mock,
        fallbackIfNoAction: () => navigation.navigate(NavigatorName.Main),
      }),
    [navigation, startPostOnboarding],
  );

  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return (
    <Flex>
      <SettingsRow
        title="Start (mock) post onboarding for stax"
        desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
        onPress={() => handleInitPostOnboardingHub(DeviceModelId.stax, true)}
      />
      <SettingsRow
        title="Start post onboarding for stax"
        desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
        onPress={() => handleInitPostOnboardingHub(DeviceModelId.stax, false)}
      />
      <SettingsRow
        title="Start (mock) post onboarding for nanoX"
        desc="Pressing this should not do anything. (no actions configured for this device)."
        onPress={() => handleInitPostOnboardingHub(DeviceModelId.nanoX, true)}
      />
      <SettingsRow title="Open post onboarding hub" onPress={navigateToPostOnboardingHub} />
      <Flex m={6}>
        <PostOnboardingEntryPointCard />
      </Flex>
    </Flex>
  );
};
