import React, { useCallback, useContext } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { Flex, Text } from "@ledgerhq/react-ui";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/isSyncOnboardingSupported";
import { DeviceSelector } from "./DeviceSelector";
import { track } from "~/renderer/analytics/segment";
import OnboardingNavHeader from "../../OnboardingNavHeader";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { OnboardingContext } from "../../index";
import TrackPage from "~/renderer/analytics/TrackPage";

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
  const { setDeviceModelId } = useContext(OnboardingContext);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const handleDeviceSelect = useCallback(
    (deviceModelId: DeviceModelId) => {
      // TODO: use a feature flag to do this properly
      track("Onboarding Device - Selection", { deviceModelId, flow: "Onboarding" });
      if (isSyncOnboardingSupported(deviceModelId)) {
        navigate(`/onboarding/sync/${deviceModelId}`);
      } else {
        setDeviceModelId(deviceModelId);
        navigate("/onboarding/select-use-case");
      }
    },
    [navigate, setDeviceModelId],
  );

  return (
    <SelectDeviceContainer>
      <TrackPage category="Onboarding Device - Selection" flow="Onboarding" />
      <OnboardingNavHeader
        onClickPrevious={() =>
          navigate(hasCompletedOnboarding ? "/settings/help" : "/onboarding/welcome")
        }
      />
      <DeviceSelector onClick={handleDeviceSelect} />
      <TitleText variant="h1">{t("onboarding.screens.selectDevice.title")}</TitleText>
    </SelectDeviceContainer>
  );
}
