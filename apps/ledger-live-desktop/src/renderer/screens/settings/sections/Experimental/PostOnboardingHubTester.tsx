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

  const devicesSupportedByPostOnboarding = [
    {
      deviceModelId: DeviceModelId.stax,
      translationKey: "testStaxPostonboarding",
      dataTestId: "postonboarding-tester-button",
    },
    {
      deviceModelId: DeviceModelId.europa,
      translationKey: "testEuropaPostonboarding",
      dataTestId: "europa-postonboarding-tester-button",
    },
  ];

  return (
    <>
      {devicesSupportedByPostOnboarding.map(({ deviceModelId, translationKey, dataTestId }) => (
        <>
          <SettingsSectionRow
            key={`post-onboarding-hub-test-row-${deviceModelId}`}
            title={t(`settings.experimental.features.${translationKey}.title`)}
            desc={t(`settings.experimental.features.${translationKey}.description`)}
          >
            <Flex flexDirection={"row"} columnGap={3}>
              <Button
                data-testid={dataTestId}
                onClick={() =>
                  handleInitPostOnboarding({
                    deviceModelId,
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
                    deviceModelId,
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
        </>
      ))}
    </>
  );
};

export default PostOnboardingHubTester;
