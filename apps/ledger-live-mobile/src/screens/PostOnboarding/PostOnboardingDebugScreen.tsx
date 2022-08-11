import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import SettingsRow from "../../components/SettingsRow";
import {
  useNavigateToPostOnboardingHubCallback,
  useStartPostOnboardingCallback,
} from "../../logic/postOnboarding/hooks";

export default () => {
  const handleInit = useStartPostOnboardingCallback(DeviceModelId.nanoFTS);
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
    </Flex>
  );
};
