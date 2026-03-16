import React from "react";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

export const AssetsErrorState = () => {
  const { t } = useTranslation();

  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center", paddingVertical: "s16" }}
      testID="assets-error-state"
    >
      <Spot appearance="icon" icon={Warning} size={40} />
      <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "center", marginTop: "s8" }}>
        {t("portfolio.cryptoSection.connectionFailed")}
      </Text>
    </Box>
  );
};
