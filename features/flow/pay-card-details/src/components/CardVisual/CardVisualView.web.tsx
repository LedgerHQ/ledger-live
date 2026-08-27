import React from "react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-react";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import type { CardVisualViewProps } from "../../types";

/**
 * The card face with the balance overlay. The card is always dark, so the overlay is scoped to the
 * `dark` color-scheme class to keep the caption and amount legible whatever the app theme is.
 */
export function CardVisualView({
  balance,
  formatCountervalue,
  balanceLabel,
  isLoading = false,
}: CardVisualViewProps) {
  return (
    <div className="dark relative w-full" data-testid="card-visual">
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
  );
}
