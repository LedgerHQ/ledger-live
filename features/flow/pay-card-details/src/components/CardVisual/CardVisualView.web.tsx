import React from "react";
import { AmountDisplay, Spot } from "@ledgerhq/lumen-ui-react";
import { Snow } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "@ledgerhq/lumen-utils-shared";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import type { CardVisualViewProps } from "../../types";

export function CardVisualView({
  balance,
  formatCountervalue,
  balanceLabel,
  isLoading = false,
  isFrozen,
}: CardVisualViewProps) {
  return (
    <div className="dark relative w-full" data-testid="card-visual">
      <div className={cn("relative", isFrozen && "opacity-50")}>
        <CardArtwork />
        <div className="absolute inset-x-0 top-0 flex flex-col gap-4 p-20">
          <span className="body-3 text-muted">{balanceLabel}</span>
          <AmountDisplay
            value={balance}
            formatter={formatCountervalue}
            loading={isLoading}
            size="sm"
            data-testid="card-visual-amount"
          />
        </div>
      </div>

      {isFrozen && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spot appearance="icon" icon={Snow} data-testid="card-visual-frozen" />
        </div>
      )}
    </div>
  );
}
