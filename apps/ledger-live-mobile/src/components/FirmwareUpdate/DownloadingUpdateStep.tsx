import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import DeviceActionProgress from "../DeviceActionProgress";
import Track from "../../analytics/Track";

type Props = {
  progress?: number;
};
const DownloadingUpdateStep = ({ progress }: Props) => {
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <Track event="FirmwareUpdateDownloading" onMount />
      <DeviceActionProgress progress={progress} />
      <Text variant="h2" mt={8}>
        {progress
          ? t("FirmwareUpdate.steps.firmware")
          : t("FirmwareUpdate.steps.preparing")}
      </Text>
      <Text variant="small" color="neutral.c70" my={6}>
        {t("FirmwareUpdate.pleaseWaitDownload")}
      </Text>
    </Flex>
  );
};

export default DownloadingUpdateStep;
