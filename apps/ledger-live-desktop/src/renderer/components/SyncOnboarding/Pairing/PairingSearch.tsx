import React from "react";
import { useSelector } from "react-redux";
import { Flex, Text } from "@ledgerhq/react-ui";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";

export type SyncOnboardingPairingSearchProps = {
  deviceModelId: DeviceModelId
};

const SyncOnboardingPairing = ({ deviceModelId }: SyncOnboardingPairingSearchProps) => {
  const { t } = useTranslation();
  const currentDevice = useSelector(getCurrentDevice);

  return (
    <Flex height= "100%" width="100%" justifyContent= "center" alignItems= "center" flexDirection= "column">
      <Text variant="h3" fontSize="28px" color="neutral.c100"> {t("syncOnboarding.pairing.searching.title", { deviceModelName: deviceModelId })} -> {JSON.stringify(currentDevice)}</Text>
    </Flex>
  );
};

export default SyncOnboardingPairing;
