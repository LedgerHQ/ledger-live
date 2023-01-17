import React, { useCallback, useContext } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { Flex, Text } from "@ledgerhq/react-ui";
import { DeviceSelector } from "./DeviceSelector";
import { track } from "~/renderer/analytics/segment";
import OnboardingNavHeader from "../../OnboardingNavHeader";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";

import { OnboardingContext } from "../../index";

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
  const history = useHistory();
  const { setDeviceModelId } = useContext(OnboardingContext);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const handleDeviceSelect = useCallback(
    (deviceModelId: DeviceModelId) => {
      // TODO: use a feature flag to do this properly
      track("Onboarding Device - Selection", { deviceModelId });
      if (deviceModelId === "stax") {
        history.push(`/onboarding/sync/${deviceModelId}`);
      } else {
        setDeviceModelId(deviceModelId);
        history.push("/onboarding/select-use-case");
      }
    },
    [history, setDeviceModelId],
  );

  return (
    <SelectDeviceContainer>
      <OnboardingNavHeader
        onClickPrevious={() =>
          history.push(hasCompletedOnboarding ? "/settings/help" : "/onboarding/welcome")
        }
      />
      <DeviceSelector onClick={handleDeviceSelect} />
      <TitleText variant="h1">{t("onboarding.screens.selectDevice.title")}</TitleText>
    </SelectDeviceContainer>
  );
}
