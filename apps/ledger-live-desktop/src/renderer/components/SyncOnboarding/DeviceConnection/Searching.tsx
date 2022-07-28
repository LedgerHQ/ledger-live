import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import DeviceIllustration from "../../DeviceIllustration";

export type SyncOnboardingDeviceConnectionSearchingProps = {
  deviceModelId: DeviceModelId
};

const SyncOnboardingDeviceConnectionSearching = ({ deviceModelId }: SyncOnboardingDeviceConnectionSearchingProps) => {
  const { t } = useTranslation();
  const deviceModelName = getDeviceModel(deviceModelId).productName;

  return (
    <Flex height= "100%" width="100%" justifyContent= "center" alignItems= "center" flexDirection= "column">
      <DeviceIllustration deviceId={deviceModelId} />
      <Text variant="h3" fontSize="28px" color="neutral.c100" mt="10"> {t("syncOnboarding.connection.searching.title", { deviceModelName })}</Text>
    </Flex>
  );
};

export default SyncOnboardingDeviceConnectionSearching;
