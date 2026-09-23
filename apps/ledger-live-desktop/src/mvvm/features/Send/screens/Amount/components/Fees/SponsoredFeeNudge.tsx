import React from "react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";

export type SponsoredFeeNudgeProps = Readonly<{
  available: boolean;
  entryLabel: string;
  savingsFiatFormatted: string | null;
  onOpen: () => void;
}>;

/**
 * The sponsored-fee entry shown above the network-fees row: opens the FEE_PAYMENT selector and, when a
 * savings quote is loaded, shows the savings nudge. Presentational — the Amount ViewModel supplies its
 * data and the open handler; renders nothing when the sponsored option isn't available for the intent.
 */
export function SponsoredFeeNudge({
  available,
  entryLabel,
  savingsFiatFormatted,
  onOpen,
}: SponsoredFeeNudgeProps) {
  const { t } = useTranslation();

  if (!available) {
    return null;
  }

  return (
    <div
      className="flex w-full items-center justify-between mt-8"
      data-testid="send-sponsored-fee-nudge"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-4 cursor-pointer"
        data-testid="send-fee-payment-entry"
      >
        <span className="body-3 text-base">{entryLabel}</span>
        <ChevronRight size={16} className="text-muted" />
      </button>
      {savingsFiatFormatted ? (
        <span className="body-3 text-active" data-testid="send-sponsored-fee-savings-nudge">
          {t("newSendFlow.feePayment.nudge", { amount: savingsFiatFormatted })}
        </span>
      ) : null}
    </div>
  );
}
