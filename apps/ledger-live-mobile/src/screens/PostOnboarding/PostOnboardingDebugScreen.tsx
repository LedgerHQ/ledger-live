import { DeviceModelId } from "@ledgerhq/devices/index";
import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingEntryPointCard from "../../components/PostOnboarding/PostOnboardingEntryPointCard";
import SettingsRow from "../../components/SettingsRow";
import { useNavigateToPostOnboardingHubCallback } from "../../logic/postOnboarding/useNavigateToPostOnboardingHubCallback";

export default () => {
  const handleInitFTS = useStartPostOnboardingCallback(
    DeviceModelId.nanoFTS,
    true,
  );
  const handleInitNanoX = useStartPostOnboardingCallback(
    DeviceModelId.nanoX,
    true,
  );
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return (
    <Flex>
      <SettingsRow
        title="Start (mock) post onboarding for nanoFTS"
        desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
        onPress={handleInitFTS}
      />
      <SettingsRow
        title="Start (mock) post onboarding for nanoX"
        desc="Pressing this should not do anything. (no actions configured for this device)."
        onPress={handleInitNanoX}
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
