import React from "react";
import { useTranslation } from "~/context/Locale";
import { Box, Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { Download } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { AppInstallConfig } from "../../constants/appInstallMap";

type Props = {
  appConfig: AppInstallConfig;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationStep({ appConfig, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <Box lx={{ paddingTop: "s8", paddingBottom: "s8", paddingHorizontal: "s14" }}>
      <Box lx={{ alignItems: "center", marginBottom: "s24", marginTop: "s8" }}>
        <Download size={40} color="interactive" />
      </Box>
      <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t("deeplinkInstallApp.confirmation.title", { appName: appConfig.displayName })}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center", marginTop: "s8" }}>
        {t(
          appConfig.confirmationDescriptionKey ??
            "deeplinkInstallApp.confirmation.genericDescription",
          { appName: appConfig.displayName },
        )}
      </Text>
      <Button
        appearance="base"
        size="lg"
        lx={{ marginBottom: "s16", marginTop: "s16" }}
        onPress={onConfirm}
      >
        {t("deeplinkInstallApp.confirmation.installCTA", { appName: appConfig.displayName })}
      </Button>
      <Button appearance="gray" size="lg" onPress={onCancel}>
        {t("common.cancel")}
      </Button>
    </Box>
  );
}
