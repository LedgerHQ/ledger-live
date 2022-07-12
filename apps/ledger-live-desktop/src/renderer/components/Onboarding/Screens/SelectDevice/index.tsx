import React, { useCallback, useContext } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { Text } from "@ledgerhq/react-ui";
import { DeviceSelector } from "./DeviceSelector";
import { track } from "~/renderer/analytics/segment";
import OnboardingNavHeader from "../../OnboardingNavHeader";

import { OnboardingContext } from "../../index";

const SelectDeviceContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const TitleText = styled(Text)`
  position: absolute;
  top: 90px;
  align-self: center;
  color: ${p => p.theme.colors.palette.neutral.c100};
  pointer-events: none;
`;

export function SelectDevice() {
  const { t } = useTranslation();
  const history = useHistory();
  const { setDeviceModelId } = useContext(OnboardingContext);

  const handleDeviceSelect = useCallback(
    (deviceModelId: DeviceModelId) => {
      track("Onboarding Device - Selection", { deviceModelId });
      setDeviceModelId(deviceModelId);
      history.push("/onboarding/select-use-case");
    },
    [history, setDeviceModelId],
  );

  return (
    <SelectDeviceContainer>
      <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/welcome")} />
      <DeviceSelector onClick={handleDeviceSelect} />
      <TitleText variant="h3" fontSize="28px">
        {t("onboarding.screens.selectDevice.title")}
      </TitleText>
    </SelectDeviceContainer>
  );
}
