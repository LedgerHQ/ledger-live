import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
import { Flex } from "@ledgerhq/react-ui";

const PostOnboardingHubTester = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const handleInitPostOnboarding = useStartPostOnboardingCallback();

  return (
    <SettingsSectionRow
      title={t("settings.experimental.features.testPostonboarding.title")}
      desc={t("settings.experimental.features.testPostonboarding.description")}
    >
      <Flex flexDirection={"row"} columnGap={3}>
        <Button
          data-test-id="postonboarding-tester-button"
          onClick={() =>
            handleInitPostOnboarding({
              deviceModelId: DeviceModelId.stax,
              mock: true,
              fallbackIfNoAction: () => history.push("/"),
            })
          }
          primary
        >
          {t("postOnboardingDebugger.buttonTitle")} (mock)
        </Button>
        <Button
          onClick={() =>
            handleInitPostOnboarding({
              deviceModelId: DeviceModelId.stax,
              mock: false,
              fallbackIfNoAction: () => history.push("/"),
            })
          }
          primary
        >
          {t("postOnboardingDebugger.buttonTitle")}
        </Button>
      </Flex>
    </SettingsSectionRow>
  );
};

export default PostOnboardingHubTester;
