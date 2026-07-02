import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "LLD/hooks/redux";

const PostOnboardingHubTester = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onboardingDate = useSelector(onboardingDateSelector);

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
    {
      deviceModelId: DeviceModelId.apex,
      translationKey: "testApexPostonboarding",
      dataTestId: "apex-postonboarding-tester-button",
    },
  ];

  return (
    <>
      {devicesSupportedByPostOnboarding.map(({ deviceModelId, translationKey, dataTestId }) => (
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
                  fallbackIfNoAction: () => navigate("/"),
                  canShowRecover: true,
                })
              }
              appearance="accent"
              size="sm"
            >
              {t("postOnboardingDebugger.buttonTitle")} (mock)
            </Button>
            <Button
              onClick={() =>
                handleInitPostOnboarding({
                  deviceModelId,
                  mock: false,
                  fallbackIfNoAction: () => navigate("/"),
                  canShowRecover: true,
                })
              }
              appearance="accent"
              size="sm"
            >
              {t("postOnboardingDebugger.buttonTitle")}
            </Button>
          </Flex>
        </SettingsSectionRow>
      ))}
      <SettingsSectionRow
        title="onboardingDate"
        desc={`Current: ${onboardingDate ? onboardingDate.toISOString() : "null"}`}
      >
        <Flex flexDirection={"row"} columnGap={3}>
          <Button
            onClick={() => dispatch(setPostOnboardingDate({ onboardingDate: new Date() }))}
            appearance="accent"
            size="sm"
          >
            Set to today
          </Button>
          <Button
            onClick={() => dispatch(setPostOnboardingDate({ onboardingDate: null }))}
            appearance="base"
            size="sm"
          >
            Reset to null
          </Button>
        </Flex>
      </SettingsSectionRow>
    </>
  );
};

export default PostOnboardingHubTester;
