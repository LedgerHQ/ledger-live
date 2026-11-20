import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import { useTranslation } from "@shared/i18n";
import type { InfoStateCta, InfoStateProps } from "@shared/ui-info-state";
import type { OrderContentProps } from "./PredictionsOrderSheet.types";
import { canRetryOrder, formatFill, orderTitleKey } from "./orderCopy";

type OrderResult = Extract<InfoStateProps, { preset: "success" | "error" | "info" }>;

/** The outcome's content, the same on every platform. */
export function useOrderResult({
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
        description:
          "shares" in outcome
            ? t("predictions.order.filled.fill", {
                count: outcome.shares,
                ...formatFill(i18n.language, outcome),
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
