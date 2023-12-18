import React from "react";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Box, NumberedList } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { TrackScreen } from "~/analytics";

const PendingPairing = () => {
  const { t } = useTranslation();

  const deviceWording = getDeviceModel("nanoX" as DeviceModelId);
  return (
    <Box padding={6}>
      <TrackScreen category="PairDevices" name="PendingPairing" />
      <NumberedList
        items={[
          {
            title: t("PairDevices.Pairing.title1"),
            description: t("PairDevices.Pairing.step1", deviceWording),
          },
          {
            title: t("PairDevices.Pairing.title2"),
            description: t("PairDevices.Pairing.step2", deviceWording),
          },
        ]}
      />
    </Box>
  );
};

export default PendingPairing;
