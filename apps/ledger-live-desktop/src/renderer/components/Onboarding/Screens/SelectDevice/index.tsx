import React, { useCallback, useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { Flex, Text } from "@ledgerhq/react-ui";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/isSyncOnboardingSupported";
import { useFeature } from "@features/platform-feature-flags";
import CounterfeitWarningDialog from "LLD/features/Onboarding/components/CounterfeitWarningDialog";
import { DeviceSelector } from "./DeviceSelector";
import { TrackScreen } from "@shared/analytics-react";
import { track } from "@shared/analytics";
import OnboardingNavHeader from "../../OnboardingNavHeader";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { OnboardingContext } from "../../OnboardingContext";

const SelectDeviceContainer = styled(Flex).attrs({
  height: "100%",
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
})``;

const TitleText = styled(Text).attrs({
  color: "neutral.c100",
  fontSize: 32,
})`
  position: absolute;
  top: 110px;
  align-self: center;
  pointer-events: none;
`;

export function SelectDevice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setDeviceModelId } = useContext(OnboardingContext);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const fromQuickAction = !!location.state?.fromQuickAction;
  const isTouchscreenCounterfeitWarningEnabled =
    useFeature("lwdOnboardingCounterfeitWarningTouchscreens")?.enabled === true;
  const [warningDeviceModelId, setWarningDeviceModelId] = useState<DeviceModelId | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const proceedWithDevice = useCallback(
    (deviceModelId: DeviceModelId) => {
      if (isSyncOnboardingSupported(deviceModelId)) {
        navigate(`/onboarding/sync/${deviceModelId}`);
      } else {
        setDeviceModelId(deviceModelId);
        navigate("/onboarding/select-use-case");
      }
    },
    [navigate, setDeviceModelId],
  );

  const handleDeviceSelect = useCallback(
    (deviceModelId: DeviceModelId) => {
      track("Onboarding Device - Selection", { deviceModelId, flow: "Onboarding" });
      if (isTouchscreenCounterfeitWarningEnabled && isSyncOnboardingSupported(deviceModelId)) {
        setWarningDeviceModelId(deviceModelId);
        setIsWarningOpen(true);
        return;
      }
      proceedWithDevice(deviceModelId);
    },
    [isTouchscreenCounterfeitWarningEnabled, proceedWithDevice],
  );

  const handleCounterfeitWarningProceed = useCallback(() => {
    setIsWarningOpen(false);
    if (warningDeviceModelId) {
      proceedWithDevice(warningDeviceModelId);
    }
  }, [warningDeviceModelId, proceedWithDevice]);

  const handleCounterfeitWarningDismiss = useCallback(() => {
    setIsWarningOpen(false);
  }, []);

  return (
    <SelectDeviceContainer>
      <TrackScreen category="Onboarding Device - Selection" flow="Onboarding" />
      <OnboardingNavHeader
        onClickPrevious={() =>
          navigate(
            fromQuickAction
              ? "/"
              : hasCompletedOnboarding
                ? "/settings/help"
                : "/onboarding/welcome",
          )
        }
      />
      <DeviceSelector onClick={handleDeviceSelect} />
      <TitleText variant="h1">{t("onboarding.screens.selectDevice.title")}</TitleText>
      {warningDeviceModelId ? (
        <CounterfeitWarningDialog
          open={isWarningOpen}
          deviceModelId={warningDeviceModelId}
          onProceed={handleCounterfeitWarningProceed}
          onDismiss={handleCounterfeitWarningDismiss}
        />
      ) : null}
    </SelectDeviceContainer>
  );
}
