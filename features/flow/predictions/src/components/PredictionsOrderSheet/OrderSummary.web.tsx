import React from "react";
import { MediaImage, Tag } from "@ledgerhq/lumen-ui-react";
import type { OrderSummaryProps } from "./PredictionsOrderSheet.types";
import { outcomeTagAppearance } from "./orderCopy";

export function OrderSummary({ display }: OrderSummaryProps) {
  return (
    <div className="flex w-full items-center gap-12" data-testid="predictions-order-summary">
      <MediaImage
        {...(display.imageUrl !== undefined && { src: display.imageUrl })}
        alt=""
        fallback={display.marketTitle}
        size={40}
        data-testid="predictions-order-market-image"
      />
      <div className="flex min-w-0 flex-1 flex-col text-left">
        {display.eventTitle !== undefined ? (
          <p className="body-3 text-muted">{display.eventTitle}</p>
        ) : null}
        <div className="flex items-center justify-between gap-8">
          <p className="min-w-0 body-2-semi-bold text-base">{display.marketTitle}</p>
          <Tag
            className="max-w-1/2 shrink-0"
            size="md"
            appearance={outcomeTagAppearance(display)}
            label={display.outcomeLabel}
            data-testid="predictions-order-outcome"
          />
        </div>
      </div>
    </div>
  );
}
