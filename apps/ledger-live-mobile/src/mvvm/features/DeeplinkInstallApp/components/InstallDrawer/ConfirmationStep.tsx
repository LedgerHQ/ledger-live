import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Button, Icons } from "@ledgerhq/native-ui";
import type { AppInstallConfig } from "../../constants/appInstallMap";

type Props = {
  appConfig: AppInstallConfig;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationStep({ appConfig, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <Flex pt={3} pb={3} px={5}>
      <Flex alignItems="center" mb={7} mt={3}>
        <Icons.Download size="L" color="primary.c80" />
      </Flex>
      <Text variant="h5" fontWeight="semiBold" textAlign="center">
        {t("deeplinkInstallApp.confirmation.title", { appName: appConfig.displayName })}
      </Text>
      <Text variant="paragraph" color="neutral.c70" textAlign="center" mt={3}>
        {t(
          appConfig.confirmationDescriptionKey ?? "deeplinkInstallApp.confirmation.genericDescription",
          { appName: appConfig.displayName },
        )}
      </Text>
      <Button mb={6} mt={6} size="medium" type="main" onPress={onConfirm}>
        {t("deeplinkInstallApp.confirmation.installCTA", { appName: appConfig.displayName })}
      </Button>
      <Button size="medium" onPress={onCancel}>
        {t("common.cancel")}
      </Button>
    </Flex>
  );
}
