import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

export type SyncOnboardingPairingSuccessProps = {
  device: Device
};

const SyncOnboardingPairingSuccess = ({ device }: SyncOnboardingPairingSuccessProps) => {
  const { t } = useTranslation();

  return (
    <Flex height= "100%" width="100%" justifyContent= "center" alignItems= "center" flexDirection= "column">
      <Text variant="h3" fontSize="28px" color="neutral.c100"> {t("syncOnboarding.pairing.success.title", { deviceName: device.deviceName ?? device.modelId })} -> {JSON.stringify(device)}</Text>
    </Flex>
  );
};

export default SyncOnboardingPairingSuccess;
