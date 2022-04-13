import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import FirmwareProgress from "../FirmwareProgress";
import { track } from "../../analytics";

type Props = {
  progress?: number;
};
const DownloadingUpdateStep = ({ progress }: Props) => {
  const { t } = useTranslation();
  
  useEffect(() => {
      track("DownloadingFirmware");
  }, []);

  return (
    <Flex alignItems="center">
      <FirmwareProgress progress={progress} />
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
