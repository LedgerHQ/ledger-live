import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import PostOnboardingEntryPointCard from "../../components/PostOnboarding/PostOnboardingEntryPointCard";
import SettingsRow from "../../components/SettingsRow";
import {
  useNavigateToPostOnboardingHubCallback,
  useStartPostOnboardingCallback,
} from "../../logic/postOnboarding/hooks";

export default () => {
  const handleInit = useStartPostOnboardingCallback(
    DeviceModelId.nanoFTS,
    true,
  );
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return (
    <Flex>
      <SettingsRow
        title="INIT post onboarding for nanoFTS"
        onPress={handleInit}
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
