import React from "react";
import { useTranslation } from "@shared/i18n";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { orderTitleKey } from "./orderCopy";

export function OrderPlacing() {
  const { t } = useTranslation();

  return (
    <Box
      lx={{ alignItems: "center", gap: "s16", paddingTop: "s32", paddingBottom: "s56" }}
      testID="predictions-order-placing"
    >
      <Spinner size={32} />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t(orderTitleKey(null))}
      </Text>
    </Box>
  );
}
