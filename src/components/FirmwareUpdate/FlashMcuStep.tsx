import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { track } from "../../analytics";
import FirmwareProgress from "../FirmwareProgress";

type Props = {
  progress?: number;
  installing?: string | null;
};
const FlashMcuStep = ({ progress, installing }: Props) => {
  const { t } = useTranslation();

  useEffect(() => {
    track("FirmwareUpdateFlashingMCU");
  }, []);

  return (
    <Flex alignItems="center">
      <FirmwareProgress progress={progress} />
      <Text variant="h2" mt={8}>
        {progress && installing
          ? t(`FirmwareUpdate.steps.${installing}`)
          : t("FirmwareUpdate.steps.preparing")}
      </Text>
      <Text variant="small" color="neutral.c70" my={6}>
        {t("FirmwareUpdate.pleaseWaitUpdate")}
      </Text>
    </Flex>
  );
};

export default FlashMcuStep;
