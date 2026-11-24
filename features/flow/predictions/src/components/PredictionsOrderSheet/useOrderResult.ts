import type { PredictionsOrderReport } from "@features/platform-predictions";
import { useTranslation } from "@shared/i18n";
import type { InfoStateCta, InfoStateProps } from "@shared/ui-info-state";
import type { OrderContentProps } from "./PredictionsOrderSheet.types";
import { canRetryOrder, formatFill, orderTitleKey } from "./orderCopy";

type OrderResult = Extract<InfoStateProps, { preset: "success" | "error" | "info" }>;

export function useOrderResult({
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
        description:
          "shares" in report
            ? t("predictions.order.filled.fill", {
                count: report.shares,
                ...formatFill(i18n.language, report),
              })
            : t("predictions.order.filled.description"),
        primaryCta: {
          label: t("predictions.order.filled.return"),
          onPress: onClose,
          testID: "predictions-order-return",
        },
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
