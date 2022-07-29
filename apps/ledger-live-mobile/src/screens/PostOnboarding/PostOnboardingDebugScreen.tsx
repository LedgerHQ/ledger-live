import { DeviceModelId } from "@ledgerhq/devices/lib/";
import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { useInitPostOnboarding } from "../../../logic/postOnboarding/hooks";
import SettingsRow from "../../components/SettingsRow";
import { useNavigateToPostOnboardingHub } from "../../logic/postOnboarding/hooks";

export default () => {
  const handleInit = useInitPostOnboarding(DeviceModelId.nanoFTS);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHub();
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
