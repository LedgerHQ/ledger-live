import React from "react";
import { ScrollView } from "react-native";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { InfoState, type InfoStateCta } from "@shared/ui-info-state";
import type { PredictionsOrderReport } from "@features/platform-predictions";
import type { PredictionsOrderDetails } from "../../predictionsOrderStore.internals";
import { useOrderResult } from "../PredictionsOrderSheet/useOrderResult";

const CENTRED_WHEN_IT_FITS = { flexGrow: 1, justifyContent: "center" } as const;

export type PredictionsOrderResultContentProps = Readonly<{
  order: PredictionsOrderDetails;
  report: PredictionsOrderReport;
  onClose: () => void;
  onRetry: () => void;
}>;

function OrderButton({
  cta,
  appearance,
}: Readonly<{ cta: InfoStateCta; appearance: "base" | "gray" }>) {
  return (
    <Button
      appearance={appearance}
      size="lg"
      lx={{ width: "full" }}
      onPress={cta.onPress}
      disabled={cta.disabled}
      loading={cta.loading}
      icon={cta.icon}
      testID={cta.testID}
    >
      {cta.label}
    </Button>
  );
}

/** Fills its page: the result centred, its buttons at the bottom. */
export function PredictionsOrderResultContent(props: PredictionsOrderResultContentProps) {
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
        {primaryCta ? <OrderButton cta={primaryCta} appearance="base" /> : null}
        {secondaryCta ? <OrderButton cta={secondaryCta} appearance="gray" /> : null}
      </Box>
    </Box>
  );
}
