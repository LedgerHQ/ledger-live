import React from "react";
import { useSelector } from "react-redux";
import { Flex, Text } from "@ledgerhq/react-ui";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";
import PairingSuccess from "./PairingSuccess";
import PairingSearch from "./PairingSearch";

export type SyncOnboardingPairingProps = {
  deviceModelId: DeviceModelId
};

const SyncOnboardingPairing = ({ deviceModelId }: SyncOnboardingPairingProps) => {
  const { t } = useTranslation();
  const currentDevice = useSelector(getCurrentDevice);

  if (currentDevice) {
    return <PairingSuccess device={currentDevice} />;
  }

  return <PairingSearch deviceModelId={deviceModelId} />;
};

export default SyncOnboardingPairing;
