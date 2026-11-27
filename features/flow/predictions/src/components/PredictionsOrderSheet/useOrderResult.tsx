import React from "react";
import type { PredictionsOrderReport } from "@features/platform-predictions";
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

type FilledReport = Extract<PredictionsOrderReport, { status: "filled" }>;
type Translate = ReturnType<typeof useTranslation>["t"];

function fillDescription(
  t: Translate,
  language: string,
  amountPaid: number,
  report: FilledReport,
): string {
  const amount = formatUsd(language, amountPaid);
  if (!("shares" in report)) return t("predictions.order.filled.paid", { amount });
  return t("predictions.order.filled.fill", {
    count: displayedShares(report.shares),
    shares: formatShares(language, report.shares),
    amount,
  });
}

export function useOrderResult({
  order,
  report,
  onClose,
  onRetry,
}: OrderContentProps & Readonly<{ report: PredictionsOrderReport }>): OrderResult {
  const { t, i18n } = useTranslation();
  const title = t(orderTitleKey(report));
  const closeCta: InfoStateCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "predictions-order-close",
  };

  switch (report.status) {
    case "filled":
      return {
        preset: "success",
        title,
        description: fillDescription(t, i18n.language, order.amountPaid, report),
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
        report.status === "rejected"
          ? t(`predictions.order.rejected.${report.reason}`)
          : t("predictions.order.notFilled.description");
      if (!canRetryOrder(report)) {
        return {
          preset: "error",
          title,
          description,
          primaryCta: closeCta,
          testID: `predictions-order-${report.status}`,
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
        testID: `predictions-order-${report.status}`,
      };
    }
  }
}
