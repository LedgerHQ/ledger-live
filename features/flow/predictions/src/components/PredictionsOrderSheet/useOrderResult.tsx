import React from "react";
import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import { useTranslation } from "@shared/i18n";
import type { InfoStateCta, InfoStateProps } from "@shared/ui-info-state";
import type { OrderContentProps } from "./PredictionsOrderSheet.types";
import {
  canRetryOrder,
  displayedShares,
  formatShares,
  formatUsd,
  orderTitleKey,
} from "./orderCopy";
import { OrderSummary } from "./OrderSummary";

type OrderResult = Extract<InfoStateProps, { preset: "success" | "error" | "info" }>;

type FilledOutcome = Extract<PredictionsOrderOutcome, { outcome: "filled" }>;
type Translate = ReturnType<typeof useTranslation>["t"];

/** What the user got for what they signed. */
function fillDescription(
  t: Translate,
  language: string,
  amountPaid: number,
  outcome: FilledOutcome,
): string {
  const amount = formatUsd(language, amountPaid);
  if (!("shares" in outcome)) return t("predictions.order.filled.paid", { amount });
  return t("predictions.order.filled.fill", {
    count: displayedShares(outcome.shares),
    shares: formatShares(language, outcome.shares),
    amount,
  });
}

/** The outcome's content, the same on every platform. */
export function useOrderResult({
  order,
  outcome,
  onClose,
  onRetry,
}: OrderContentProps & Readonly<{ outcome: PredictionsOrderOutcome }>): OrderResult {
  const { t, i18n } = useTranslation();
  const title = t(orderTitleKey(outcome));
  const closeCta: InfoStateCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "predictions-order-close",
  };

  switch (outcome.outcome) {
    case "filled":
      return {
        preset: "success",
        title,
        description: fillDescription(t, i18n.language, order.amountPaid, outcome),
        // Only a filled order shows its market.
        content: <OrderSummary display={order.display} />,
        primaryCta: closeCta,
        testID: "predictions-order-filled",
      };
    case "unconfirmed":
      return {
        preset: "info",
        title,
        description: t("predictions.order.unconfirmed.description"),
        primaryCta: closeCta,
        testID: "predictions-order-unconfirmed",
      };
    case "not-filled":
    case "rejected": {
      const description =
        outcome.outcome === "rejected"
          ? t(`predictions.order.rejected.${outcome.reason}`)
          : t("predictions.order.notFilled.description");
      if (!canRetryOrder(outcome)) {
        return {
          preset: "error",
          title,
          description,
          primaryCta: closeCta,
          testID: `predictions-order-${outcome.outcome}`,
        };
      }
      return {
        preset: "error",
        title,
        description,
        primaryCta: {
          label: t("predictions.order.tryAgain"),
          onPress: onRetry,
          testID: "predictions-order-retry",
        },
        secondaryCta: closeCta,
        testID: `predictions-order-${outcome.outcome}`,
      };
    }
  }
}
