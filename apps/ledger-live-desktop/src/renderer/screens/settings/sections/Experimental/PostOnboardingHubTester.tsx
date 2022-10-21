import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";

import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";

const PostOnboardingHubTester = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const handleInitFTS = useStartPostOnboardingCallback();

  return (
    <SettingsSectionRow
      title={t("settings.experimental.features.testPostonboarding.title")}
      desc={t("settings.experimental.features.testPostonboarding.description")}
    >
      <Button
        data-test-id="postonboarding-tester-button"
        onClick={() => handleInitFTS(DeviceModelId.nanoFTS, true, () => history.push("/"))}
        primary
      >
        {t("postOnboardingDebugger.buttonTitle")}
      </Button>
    </SettingsSectionRow>
  );
};

export default PostOnboardingHubTester;
