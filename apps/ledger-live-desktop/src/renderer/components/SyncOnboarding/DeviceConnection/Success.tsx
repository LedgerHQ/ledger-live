import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";
import DeviceIllustration from "../../DeviceIllustration";

export type SyncOnboardingDeviceConnectionSuccessProps = {
  device: Device;
};

const SyncOnboardingDeviceConnectionSuccess = ({
  device,
}: SyncOnboardingDeviceConnectionSuccessProps) => {
  const { t } = useTranslation();
  const deviceName = device.deviceName ?? getDeviceModel(device.modelId).productName;

  return (
    <Flex
      height="100%"
      width="100%"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
    >
      <DeviceIllustration deviceId={device.modelId} />
      <Text variant="h3" fontSize="28px" color="neutral.c100">
        {" "}
        ✅ {t("syncOnboarding.connection.success.title", { deviceName })}
      </Text>
    </Flex>
  );
};

export default SyncOnboardingDeviceConnectionSuccess;
