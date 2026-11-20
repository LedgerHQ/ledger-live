import React from "react";
import { useTranslation } from "@shared/i18n";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import type { OrderContentProps } from "./PredictionsOrderSheet.types";
import { orderTitleKey } from "./orderCopy";
import { useOrderResult } from "./useOrderResult";

function OrderResult(props: OrderContentProps & Readonly<{ outcome: PredictionsOrderOutcome }>) {
  return <InfoState {...useOrderResult(props)} />;
}

export function OrderContent({ outcome, onClose, onRetry }: OrderContentProps) {
  const { t } = useTranslation();

  if (outcome === null) {
    return (
      <Box
        lx={{ alignItems: "center", gap: "s16", paddingTop: "s32", paddingBottom: "s56" }}
        testID="predictions-order-placing"
      >
        <Spinner size={32} />
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t(orderTitleKey(outcome))}
        </Text>
      </Box>
    );
  }
  return <OrderResult outcome={outcome} onClose={onClose} onRetry={onRetry} />;
}
