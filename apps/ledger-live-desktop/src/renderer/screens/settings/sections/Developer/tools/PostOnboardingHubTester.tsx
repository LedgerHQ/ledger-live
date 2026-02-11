import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import DeveloperActionsRow from "../components/DeveloperActionsRow";

const PostOnboardingHubTester = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      {devicesSupportedByPostOnboarding.map(({ deviceModelId, translationKey, dataTestId }) => {
        const actions = [
          {
            key: `${deviceModelId}-mock`,
            dataTestId,
            label: `${t("postOnboardingDebugger.buttonTitle")} (mock)`,
            onClick: () => {
              handleInitPostOnboarding({
                deviceModelId,
                mock: true,
                fallbackIfNoAction: () => navigate("/"),
              });
            },
          },
          {
            key: `${deviceModelId}-real`,
            label: t("postOnboardingDebugger.buttonTitle"),
            onClick: () => {
              handleInitPostOnboarding({
                deviceModelId,
                mock: false,
                fallbackIfNoAction: () => navigate("/"),
              });
            },
          },
        ];

        return (
          <DeveloperActionsRow
            key={`post-onboarding-hub-test-row-${deviceModelId}`}
            title={t(`settings.experimental.features.${translationKey}.title`)}
            desc={t(`settings.experimental.features.${translationKey}.description`)}
            actions={actions}
          />
        );
      })}
    </>
  );
};

export default PostOnboardingHubTester;
