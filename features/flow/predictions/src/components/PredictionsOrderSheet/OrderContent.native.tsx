import React from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "@shared/i18n";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { InfoState, InfoStateButton } from "@shared/ui-info-state";
import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import type { OrderContentProps } from "./PredictionsOrderSheet.types";
import { orderTitleKey } from "./orderCopy";
import { useOrderResult } from "./useOrderResult";

const CENTRED_WHEN_IT_FITS = { flexGrow: 1, justifyContent: "center" } as const;

/**
 * Full screen: the outcome and its market centred together, scrolling when they don't fit (long
 * titles, large text), the actions pinned at the bottom.
 */
function OrderResult(props: OrderContentProps & Readonly<{ outcome: PredictionsOrderOutcome }>) {
  const { primaryCta, secondaryCta, ...result } = useOrderResult(props);

  return (
    <Box lx={{ flex: 1, gap: "s16" }}>
      <ScrollView
        contentContainerStyle={CENTRED_WHEN_IT_FITS}
        showsVerticalScrollIndicator={false}
        testID="predictions-order-result-scroll"
      >
        <InfoState {...result} size="hug" />
      </ScrollView>
      <Box lx={{ gap: "s16" }}>
        {primaryCta ? <InfoStateButton cta={primaryCta} appearance="base" /> : null}
        {secondaryCta ? <InfoStateButton cta={secondaryCta} appearance="gray" /> : null}
      </Box>
    </Box>
  );
}

export function OrderContent({ order, outcome, onClose, onRetry }: OrderContentProps) {
  const { t } = useTranslation();

  if (outcome === null) {
    return (
      <Box
        lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s16" }}
        testID="predictions-order-placing"
      >
        <Spinner size={32} />
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t(orderTitleKey(outcome))}
        </Text>
      </Box>
    );
  }
  return <OrderResult order={order} outcome={outcome} onClose={onClose} onRetry={onRetry} />;
}
