import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

export function ConnectingState(): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", alignItems: "center", paddingTop: "s32", paddingBottom: "s32" }}>
      <Box lx={{ width: "full", alignItems: "center", gap: "s16" }}>
        <Spinner size={40} color="base" />
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("deviceIntentExecutor.connectDevice.states.connecting.title")}
        </Text>
      </Box>
    </Box>
  );
}
