import { Flex, Text, IconsLegacy, Log, Button } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import Track from "~/analytics/Track";

type Props = {
  onReinstallApps: () => void;
};
const FirmwareUpdatedStep = ({ onReinstallApps }: Props) => {
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <Track event="FirmwareUpdateFinished" onMount />
      <IconsLegacy.CircledCheckSolidMedium size={56} color="success.c50" />
      <Flex my={7}>
        <Log>{t("FirmwareUpdate.success")}</Log>
      </Flex>
      <Text variant="paragraph">{t("FirmwareUpdate.pleaseReinstallApps")}</Text>
      <Button type="main" alignSelf="stretch" mt={10} onPress={onReinstallApps}>
        {t("FirmwareUpdate.reinstallApps")}
      </Button>
    </Flex>
  );
};

export default FirmwareUpdatedStep;
