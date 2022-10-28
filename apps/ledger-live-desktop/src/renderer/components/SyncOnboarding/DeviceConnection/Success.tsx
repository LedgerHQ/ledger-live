import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { useHistory } from "react-router-dom";

import DeviceIllustration from "../../DeviceIllustration";
import OnboardingNavHeader from "../../Onboarding/OnboardingNavHeader";

export type SyncOnboardingDeviceConnectionSuccessProps = {
  device: Device;
};

const SyncOnboardingDeviceConnectionSuccess = ({
  device,
}: SyncOnboardingDeviceConnectionSuccessProps) => {
  const { t } = useTranslation();
  const history = useHistory();

  const deviceName = device.deviceName ?? getDeviceModel(device.modelId).productName;

  return (
    <Flex height="100%" width="100%" flexDirection="column">
      <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
      <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column">
        <DeviceIllustration deviceId={device.modelId} />
        <Text variant="h3Inter" color="neutral.c100" mt={16}>
          {t("syncOnboarding.connection.success.title", { deviceName })}
        </Text>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingDeviceConnectionSuccess;
