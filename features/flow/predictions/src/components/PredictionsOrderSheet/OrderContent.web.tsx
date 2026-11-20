import React from "react";
import { useTranslation } from "@shared/i18n";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import type { OrderContentProps } from "./PredictionsOrderSheet.types";
import { orderTitleKey } from "./orderCopy";
import { useOrderResult } from "./useOrderResult";

function OrderResult(props: OrderContentProps & Readonly<{ outcome: PredictionsOrderOutcome }>) {
  return <InfoState {...useOrderResult(props)} size="hug" />;
}

export function OrderContent({ order, outcome, onClose, onRetry }: OrderContentProps) {
  const { t } = useTranslation();

  if (outcome === null) {
    return (
      <div
        // Same layout as the device intent executor's loading, which this dialog takes over from.
        className="flex w-full flex-col items-center gap-16 px-16 py-24"
        data-testid="predictions-order-placing"
      >
        <Spinner size={32} />
        <h3 className="heading-4-semi-bold text-center text-base">{t(orderTitleKey(outcome))}</h3>
      </div>
    );
  }
  return <OrderResult order={order} outcome={outcome} onClose={onClose} onRetry={onRetry} />;
}
