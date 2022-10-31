import { DeviceModelId } from "@ledgerhq/devices/index";
import { Flex } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingEntryPointCard from "../../components/PostOnboarding/PostOnboardingEntryPointCard";
import SettingsRow from "../../components/SettingsRow";
import { useNavigateToPostOnboardingHubCallback } from "../../logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import { NavigatorName } from "../../const";

export default () => {
  const navigation = useNavigation();
  const startPostOnboarding = useStartPostOnboardingCallback();

  const handleInitFTSMock = useCallback(
    () => startPostOnboarding(DeviceModelId.nanoFTS, true),
    [startPostOnboarding],
  );
  const handleInitFTS = useCallback(
    () =>
      startPostOnboarding(DeviceModelId.nanoFTS, false, () =>
        navigation.navigate(NavigatorName.Base, {
          screen: NavigatorName.Main,
        }),
      ),
    [navigation, startPostOnboarding],
  );
  const handleInitNanoXMock = useCallback(
    () => startPostOnboarding(DeviceModelId.nanoX, true),
    [startPostOnboarding],
  );
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return (
    <Flex>
      <SettingsRow
        title="Start (mock) post onboarding for nanoFTS"
        desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
        onPress={handleInitFTSMock}
      />
      <SettingsRow
        title="Start post onboarding for nanoFTS"
        desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
        onPress={handleInitFTS}
      />
      <SettingsRow
        title="Start (mock) post onboarding for nanoX"
        desc="Pressing this should not do anything. (no actions configured for this device)."
        onPress={handleInitNanoXMock}
      />
      <SettingsRow
        title="Open post onboarding hub"
        onPress={navigateToPostOnboardingHub}
      />
      <Flex m={6}>
        <PostOnboardingEntryPointCard />
      </Flex>
    </Flex>
  );
};
