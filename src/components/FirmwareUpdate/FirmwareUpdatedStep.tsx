import { Flex, Text, Icons, Log, Button } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";

const FirmwareUpdatedStep = () => {
  const { t } = useTranslation();
  return (
    <Flex alignItems="center">
      <Icons.CircledCheckSolidLight size={56} color="success.c100" />
      <Flex my={7}>
        <Log>{t("FirmwareUpdate.success")}</Log>
      </Flex>
      <Text variant="paragraph">{t("FirmwareUpdate.pleaseReinstallApps")}</Text>
      <Button type="main" alignSelf="stretch" mt={10}>
        {t("FirmwareUpdate.reinstallApps")}
      </Button>
    </Flex>
  );
};

export default FirmwareUpdatedStep;
