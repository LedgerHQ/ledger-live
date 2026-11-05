import React from "react";
import { Button, DialogBody, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import type { PaySuccessProps } from "./PaySuccess.types";
import { PaySuccessHero } from "./PaySuccessHero";
import { PaySuccessSummary } from "./PaySuccessSummary";
import { usePaySuccessSummaryRows } from "./usePaySuccessSummaryRows";

export function PaySuccess({
  recipient,
  recipientLabel,
  amountFormatted,
  fromAccountName,
  networkIcon,
  estimatedTime,
  canViewTransaction,
  onViewTransaction,
  onClose,
}: PaySuccessProps) {
  const { t } = useTranslation();
  const rows = usePaySuccessSummaryRows({
    amountFormatted,
    estimatedTime,
    fromAccountName,
    networkIcon,
  });

  return (
    <>
      <DialogBody className="flex flex-col py-24" data-testid="pay-success-step">
        <PaySuccessHero
          recipient={recipient}
          recipientLabel={recipientLabel}
          amountFormatted={amountFormatted}
        />

        {rows.length > 0 ? (
          <div className="mt-32 mb-16">
            <PaySuccessSummary rows={rows} />
          </div>
        ) : null}
      </DialogBody>
      <DialogFooter className="flex flex-col gap-16">
        {canViewTransaction !== false ? (
          <Button
            appearance="gray"
            size="lg"
            isFull
            data-testid="pay-success-view-transaction"
            onClick={onViewTransaction}
          >
            {t("payTab.contacts.paySuccess.viewTransaction")}
          </Button>
        ) : null}
        <Button
          appearance="base"
          size="lg"
          isFull
          data-testid="pay-success-close"
          onClick={onClose}
        >
          {t("payTab.contacts.paySuccess.close")}
        </Button>
      </DialogFooter>
    </>
  );
}
