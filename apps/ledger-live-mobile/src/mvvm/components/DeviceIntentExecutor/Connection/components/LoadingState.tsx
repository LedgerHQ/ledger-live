import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

export function LoadingState(): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", alignItems: "center", paddingTop: "s16" }}>
      <Spinner size={32} color="base" />
      <Text
        typography="heading4SemiBold"
        lx={{ color: "base", textAlign: "center", paddingTop: "s16", paddingBottom: "s32" }}
      >
        {t("deviceIntentExecutor.connectDevice.states.loading.title")}
      </Text>
    </Box>
  );
}
