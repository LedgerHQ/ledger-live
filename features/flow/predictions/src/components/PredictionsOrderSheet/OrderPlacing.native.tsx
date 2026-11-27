import React from "react";
import { useTranslation } from "@shared/i18n";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { orderTitleKey, type OrderSide } from "./orderCopy";

export function OrderPlacing({ side }: Readonly<{ side: OrderSide }>) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{ alignItems: "center", gap: "s16", paddingTop: "s32", paddingBottom: "s56" }}
      testID="predictions-order-placing"
    >
      <Spinner size={32} />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t(orderTitleKey(side, null))}
      </Text>
    </Box>
  );
}
