import React from "react";
import { Button, DialogBody, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { PaySuccessHero, type PaySuccessRecipient } from "./PaySuccessHero.web";
import {
  PaySuccessSummary,
  type PaySuccessSummaryIcon,
  type PaySuccessSummaryRow,
} from "./PaySuccessSummary.web";

export type PaySuccessProps = Readonly<{
  recipient?: PaySuccessRecipient;
  recipientLabel: string;
  amountFormatted: string;
  fromAccountName: string;
  networkIcon?: PaySuccessSummaryIcon;
  estimatedTime?: string;
  onViewTransaction: () => void;
  onClose: () => void;
}>;

export function PaySuccess({
  recipient,
  recipientLabel,
  amountFormatted,
  fromAccountName,
  networkIcon,
  estimatedTime,
  onViewTransaction,
  onClose,
}: PaySuccessProps) {
  const { t } = useTranslation();

  const rows: ReadonlyArray<PaySuccessSummaryRow> = [
    { id: "amount", label: t("payTab.contacts.paySuccess.amount"), value: amountFormatted },
    ...(estimatedTime
      ? [
          {
            id: "estimatedTime",
            label: t("payTab.contacts.paySuccess.estimatedTime"),
            value: estimatedTime,
          },
        ]
      : []),
    {
      id: "from",
      label: t("payTab.contacts.paySuccess.from"),
      value: fromAccountName,
      trailingIcon: networkIcon,
    },
  ];

  return (
    <>
      <DialogBody className="flex flex-col py-24" data-testid="pay-success-step">
        <PaySuccessHero
          recipient={recipient}
          recipientLabel={recipientLabel}
          amountFormatted={amountFormatted}
        />

        <div className="mt-32 mb-16">
          <PaySuccessSummary rows={rows} />
        </div>
      </DialogBody>
      <DialogFooter className="flex flex-col gap-16">
        <Button
          appearance="gray"
          size="lg"
          isFull
          data-testid="pay-success-view-transaction"
          onClick={onViewTransaction}
        >
          {t("payTab.contacts.paySuccess.viewTransaction")}
        </Button>
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
